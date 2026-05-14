"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { AuditResult, Severity } from "@/lib/types";

const scoreCards = [
  { key: "aeoScore", label: "AEO score", max: 30 },
  { key: "geoScore", label: "GEO score", max: 30 },
  { key: "contentQualityScore", label: "Content quality", max: 20 },
  { key: "technicalSeoScore", label: "Technical SEO", max: 10 },
  { key: "trustScore", label: "Trust signals", max: 10 }
] as const;

const severityStyles: Record<Severity, string> = {
  High: "border-red-200 bg-red-50 text-red-800",
  Medium: "border-amber-200 bg-amber-50 text-amber-800",
  Low: "border-emerald-200 bg-emerald-50 text-emerald-800"
};

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="h-2 w-full rounded bg-slate-100" aria-hidden="true">
      <div
        className="h-2 rounded bg-accent-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function ScoreCard({
  label,
  value,
  max
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-medium text-muted">{label}</h3>
        <p className="text-sm font-semibold text-ink">
          {value}
          <span className="text-muted">/{max}</span>
        </p>
      </div>
      <div className="mt-4">
        <ScoreBar value={value} max={max} />
      </div>
    </article>
  );
}

function Section({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Results({ result }: { result: AuditResult }) {
  const overallPercent = Math.max(1, Math.min(100, result.overallScore));

  return (
    <div className="mt-8 space-y-5">
      <section className="rounded-lg border border-accent-100 bg-accent-50 p-5 shadow-panel">
        <div className="grid gap-5 lg:grid-cols-[240px_1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-accent-700">
              Overall score
            </p>
            <p className="mt-2 text-6xl font-semibold leading-none text-ink">
              {overallPercent}
              <span className="text-2xl text-muted">/100</span>
            </p>
          </div>
          <div>
            <ScoreBar value={overallPercent} max={100} />
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
              {result.summary}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {scoreCards.map((card) => (
          <ScoreCard
            key={card.key}
            label={card.label}
            value={result[card.key]}
            max={card.max}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Top shortcomings">
          <div className="space-y-3">
            {result.shortcomings.map((item, index) => (
              <article
                className="rounded-lg border border-line bg-white p-4"
                key={`${item.issue}-${index}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-sm font-semibold text-ink">{item.issue}</h3>
                  <span
                    className={`rounded border px-2 py-1 text-xs font-semibold ${severityStyles[item.severity]}`}
                  >
                    {item.severity}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{item.whyItMatters}</p>
                <p className="mt-3 text-sm leading-6 text-ink">
                  <span className="font-semibold">Fix: </span>
                  {item.fix}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Priority fixes">
          <ol className="space-y-3">
            {result.priorityFixes.map((item) => (
              <li className="rounded-lg border border-line bg-white p-4" key={item.priority}>
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-accent-600 text-sm font-semibold text-white">
                    {item.priority}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      {item.recommendation}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {item.expectedImpact}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Section title="Suggested FAQs">
          <div className="space-y-4">
            {result.suggestedFAQs.map((faq) => (
              <article key={faq.question}>
                <h3 className="text-sm font-semibold text-ink">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{faq.answer}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Suggested content additions">
          <div className="space-y-4">
            {result.suggestedContentBlocks.map((block) => (
              <article key={block.blockTitle}>
                <h3 className="text-sm font-semibold text-ink">{block.blockTitle}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-accent-700">
                  {block.whereToAdd}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">{block.sampleCopy}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Suggested schema markup">
          <div className="space-y-3">
            {result.suggestedSchema.map((schema) => (
              <article
                className="rounded-lg border border-line bg-slate-50 p-4"
                key={schema.schemaType}
              >
                <h3 className="text-sm font-semibold text-ink">{schema.schemaType}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{schema.reason}</p>
              </article>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => isValidUrl(url) && !isLoading, [url, isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!isValidUrl(url)) {
      setError("Enter a valid HTTP or HTTPS URL.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Analysis failed. Try another URL.");
      }

      setResult(payload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while analyzing this URL."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-ink">AEO/GEO Content Auditor</p>
          <p className="hidden text-sm text-muted sm:block">SEO analysis for AI search</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-accent-700">
              Production audit
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
              Audit any webpage for answer engine and generative engine readiness.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Fetch a live page, extract its SEO signals, and receive a scored action plan
              for AEO, GEO, content depth, technical SEO, and trust signals.
            </p>
          </div>

          <form
            className="rounded-lg border border-line bg-white p-5 shadow-panel"
            onSubmit={handleSubmit}
          >
            <label className="text-sm font-medium text-ink" htmlFor="url">
              Page URL
            </label>
            <input
              className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-3 text-sm text-ink outline-none ring-accent-500 placeholder:text-slate-400 focus:ring-2"
              id="url"
              inputMode="url"
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/page"
              type="url"
              value={url}
            />
            <button
              className="mt-4 w-full rounded-lg bg-accent-600 px-4 py-3 text-sm font-semibold text-white shadow-panel disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!canSubmit}
              type="submit"
            >
              {isLoading ? "Analyzing page..." : "Analyze"}
            </button>
            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            {isLoading ? (
              <p className="mt-4 rounded-lg border border-accent-100 bg-accent-50 px-3 py-2 text-sm text-accent-700">
                Fetching the page, extracting content, and running the AI audit.
              </p>
            ) : null}
          </form>
        </section>

        {result ? <Results result={result} /> : null}
      </div>
    </main>
  );
}
