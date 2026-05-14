export type Severity = "High" | "Medium" | "Low";

export type Shortcoming = {
  issue: string;
  severity: Severity;
  whyItMatters: string;
  fix: string;
};

export type PriorityFix = {
  priority: number;
  recommendation: string;
  expectedImpact: string;
};

export type SuggestedFAQ = {
  question: string;
  answer: string;
};

export type SuggestedContentBlock = {
  blockTitle: string;
  whereToAdd: string;
  sampleCopy: string;
};

export type SuggestedSchema = {
  schemaType: string;
  reason: string;
};

export type AuditResult = {
  overallScore: number;
  aeoScore: number;
  geoScore: number;
  contentQualityScore: number;
  technicalSeoScore: number;
  trustScore: number;
  summary: string;
  shortcomings: Shortcoming[];
  priorityFixes: PriorityFix[];
  suggestedFAQs: SuggestedFAQ[];
  suggestedContentBlocks: SuggestedContentBlock[];
  suggestedSchema: SuggestedSchema[];
};

export type ExtractedPage = {
  url: string;
  title: string;
  metaDescription: string;
  headings: Array<{
    level: number;
    text: string;
  }>;
  paragraphs: string[];
  internalLinks: string[];
  externalLinks: string[];
  schemaScripts: string[];
  wordCount: number;
};
