import { NextRequest, NextResponse } from "next/server";
import { extractPageContent } from "@/lib/extract";
import type { AuditResult, ExtractedPage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const FETCH_TIMEOUT_MS = 12000;
const MAX_HTML_BYTES = 2_000_000;
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

const auditJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "overallScore",
    "aeoScore",
    "geoScore",
    "contentQualityScore",
    "technicalSeoScore",
    "trustScore",
    "summary",
    "shortcomings",
    "priorityFixes",
    "suggestedFAQs",
    "suggestedContentBlocks",
    "suggestedSchema"
  ],
  properties: {
    overallScore: { type: "number" },
    aeoScore: { type: "number" },
    geoScore: { type: "number" },
    contentQualityScore: { type: "number" },
    technicalSeoScore: { type: "number" },
    trustScore: { type: "number" },
    summary: { type: "string" },
    shortcomings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["issue", "severity", "whyItMatters", "fix"],
        properties: {
          issue: { type: "string" },
          severity: { type: "string", enum: ["High", "Medium", "Low"] },
          whyItMatters: { type: "string" },
          fix: { type: "string" }
        }
      }
    },
    priorityFixes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["priority", "recommendation", "expectedImpact"],
        properties: {
          priority: { type: "number" },
          recommendation: { type: "string" },
          expectedImpact: { type: "string" }
        }
      }
    },
    suggestedFAQs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "answer"],
        properties: {
          question: { type: "string" },
          answer: { type: "string" }
        }
      }
    },
    suggestedContentBlocks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["blockTitle", "whereToAdd", "sampleCopy"],
        properties: {
          blockTitle: { type: "string" },
          whereToAdd: { type: "string" },
          sampleCopy: { type: "string" }
        }
      }
    },
    suggestedSchema: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["schemaType", "reason"],
        properties: {
          schemaType: { type: "string" },
          reason: { type: "string" }
        }
      }
    }
  }
} as const;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validateUrl(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("A URL is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error("Enter a valid URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs can be analyzed.");
  }

  return parsed.href;
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "AEO-GEO-Content-Auditor/1.0"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`The page returned HTTP ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error("The URL did not return an HTML page.");
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_HTML_BYTES) {
      throw new Error("The page HTML is too large to analyze.");
    }

    const html = await response.text();
    if (html.length > MAX_HTML_BYTES) {
      throw new Error("The page HTML is too large to analyze.");
    }

    return html;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The page fetch timed out. Try a faster URL.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildPrompt(page: ExtractedPage): string {
  return JSON.stringify(
    {
      task: "Audit this webpage for AEO and GEO optimization.",
      scoringModel: {
        aeoReadiness: "0-30 points",
        geoReadiness: "0-30 points",
        contentDepthAndHelpfulness: "0-20 points",
        technicalSeoSignals: "0-10 points",
        trustAndCitationStrength: "0-10 points",
        total: "1-100 points"
      },
      evaluationCriteria: [
        "direct answer quality",
        "search intent match",
        "FAQ coverage",
        "snippet readiness",
        "entity clarity",
        "topical completeness",
        "semantic structure",
        "schema presence",
        "citations and trust signals",
        "missing sections",
        "weak headings",
        "weak introduction",
        "thin content",
        "over-optimized content",
        "unclear brand or service positioning",
        "missing comparison tables",
        "missing examples",
        "missing step-by-step guidance"
      ],
      instructions: [
        "Return practical SEO recommendations for a manager and content team.",
        "Keep section scores within their point maximums.",
        "Make overallScore the rounded sum of all section scores.",
        "Use the supplied extracted page signals only. Do not invent page facts.",
        "Make suggested FAQ answers concise and directly answerable.",
        "Prefer high-impact, page-level fixes over generic advice.",
        "Return 3-8 shortcomings, 3-6 priority fixes, 3-6 FAQs, 2-5 content blocks, and 1-5 schema recommendations."
      ],
      page
    },
    null,
    2
  );
}

async function analyzeWithOpenAI(page: ExtractedPage): Promise<AuditResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a senior SEO strategist specializing in AEO, GEO, structured data, and content quality. Return only valid JSON that matches the requested schema."
        },
        {
          role: "user",
          content: buildPrompt(page)
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "aeo_geo_content_audit",
          strict: true,
          schema: auditJsonSchema
        }
      }
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || "OpenAI analysis failed.";
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("OpenAI returned an empty analysis.");
  }

  try {
    return normalizeAudit(JSON.parse(content));
  } catch {
    throw new Error("OpenAI returned malformed JSON.");
  }
}

function clampScore(value: unknown, min: number, max: number): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function normalizeAudit(result: AuditResult): AuditResult {
  const aeoScore = clampScore(result.aeoScore, 0, 30);
  const geoScore = clampScore(result.geoScore, 0, 30);
  const contentQualityScore = clampScore(result.contentQualityScore, 0, 20);
  const technicalSeoScore = clampScore(result.technicalSeoScore, 0, 10);
  const trustScore = clampScore(result.trustScore, 0, 10);
  const calculatedOverall =
    aeoScore + geoScore + contentQualityScore + technicalSeoScore + trustScore;

  return {
    ...result,
    overallScore: clampScore(calculatedOverall, 1, 100),
    aeoScore,
    geoScore,
    contentQualityScore,
    technicalSeoScore,
    trustScore
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const url = validateUrl(body?.url);
    const html = await fetchHtml(url);
    const extractedPage = extractPageContent(html, url);

    if (extractedPage.wordCount < 50) {
      return jsonError("The page has too little readable content to analyze.", 422);
    }

    const result = await analyzeWithOpenAI(extractedPage);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to analyze this page.";
    const status =
      message.includes("OPENAI_API_KEY") || message.includes("OpenAI") ? 500 : 400;

    return jsonError(message, status);
  }
}
