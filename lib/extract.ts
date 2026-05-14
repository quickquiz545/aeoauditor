import * as cheerio from "cheerio";
import type { ExtractedPage } from "./types";

const MAX_TEXT_ITEMS = 90;
const MAX_LINKS = 80;
const MAX_SCHEMA_ITEMS = 20;
const MAX_SCHEMA_LENGTH = 4000;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function countWords(values: string[]): number {
  return values
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function extractPageContent(html: string, pageUrl: string): ExtractedPage {
  const $ = cheerio.load(html);
  const baseUrl = new URL(pageUrl);

  $("script:not([type='application/ld+json']), style, noscript, template, svg").remove();

  const title = cleanText($("title").first().text());
  const metaDescription = cleanText(
    $("meta[name='description']").attr("content") ||
      $("meta[property='og:description']").attr("content") ||
      ""
  );

  const headings = $("h1, h2, h3, h4, h5, h6")
    .map((_, element) => {
      const tagName = String($(element).prop("tagName") || "h2").toLowerCase();
      return {
        level: Number(tagName.replace("h", "")),
        text: cleanText($(element).text())
      };
    })
    .get()
    .filter((heading) => heading.text.length > 0)
    .slice(0, MAX_TEXT_ITEMS);

  const paragraphs = $("main p, article p, section p, p")
    .map((_, element) => cleanText($(element).text()))
    .get()
    .filter((text) => text.length >= 35)
    .slice(0, MAX_TEXT_ITEMS);

  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    try {
      const linkUrl = new URL(href, baseUrl);
      if (!["http:", "https:"].includes(linkUrl.protocol)) {
        return;
      }

      const normalized = linkUrl.href.replace(/#.*$/, "");
      if (linkUrl.hostname === baseUrl.hostname) {
        internalLinks.push(normalized);
      } else {
        externalLinks.push(normalized);
      }
    } catch {
      // Ignore malformed links; the audit should continue with the usable page content.
    }
  });

  const schemaScripts = $("script[type='application/ld+json']")
    .map((_, element) => cleanText($(element).html() || ""))
    .get()
    .filter(Boolean)
    .map((schema) => schema.slice(0, MAX_SCHEMA_LENGTH))
    .slice(0, MAX_SCHEMA_ITEMS);

  const wordCount = countWords([
    title,
    metaDescription,
    ...headings.map((heading) => heading.text),
    ...paragraphs
  ]);

  return {
    url: pageUrl,
    title,
    metaDescription,
    headings,
    paragraphs,
    internalLinks: unique(internalLinks).slice(0, MAX_LINKS),
    externalLinks: unique(externalLinks).slice(0, MAX_LINKS),
    schemaScripts,
    wordCount
  };
}
