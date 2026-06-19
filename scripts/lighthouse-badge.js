import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const manifestPath = resolve(projectRoot, '.lighthouseci', 'manifest.json');
const badgesDir = resolve(projectRoot, 'lighthouse-badges');

const categories = [
  { key: 'performance', label: 'performance', file: 'performance.json' },
  { key: 'accessibility', label: 'accessibility', file: 'accessibility.json' },
  { key: 'best-practices', label: 'best practices', file: 'best-practices.json' },
  { key: 'seo', label: 'SEO', file: 'seo.json' },
];

function scoreColor(score) {
  if (score >= 90) return 'brightgreen';
  if (score >= 50) return 'yellow';
  return 'red';
}

function toBadge(label, score) {
  return {
    schemaVersion: 1,
    label,
    message: String(score),
    color: scoreColor(score),
  };
}

function formatAuditScore(score) {
  if (score === null || score === undefined) return 'n/a';
  return String(Math.round(score * 100));
}

function formatAuditItem(item) {
  if (item.url) return item.url;
  if (item.sourceLocation?.url) {
    const detail = item.description ? `: ${item.description}` : '';
    return `${item.sourceLocation.url}${detail}`;
  }
  if (item.source && item.description) return `${item.source}: ${item.description}`;
  if (item.reason) return item.reason;
  if (item.node?.snippet) return item.node.snippet.replace(/\s+/g, ' ').trim();
  if (item.label) return item.label;
  return JSON.stringify(item).slice(0, 120);
}

function loadRun() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const run = manifest.find((entry) => entry.isRepresentativeRun) ?? manifest[0];
  if (!run?.summary) {
    throw new Error(`No Lighthouse summary found in ${manifestPath}`);
  }
  if (!run.jsonPath) {
    throw new Error(`No Lighthouse report path found in ${manifestPath}`);
  }

  const report = JSON.parse(readFileSync(run.jsonPath, 'utf8'));
  return { run, report };
}

function reportCategoryIssues(report, categoryKey, categoryScore) {
  const category = report.categories[categoryKey];
  if (!category) return;

  const issues = category.auditRefs
    .map((ref) => ({ ref, audit: report.audits[ref.id] }))
    .filter(({ audit }) => audit && audit.score !== null && audit.score < 1)
    .sort((a, b) => (a.audit.score ?? 0) - (b.audit.score ?? 0));

  if (!issues.length) {
    console.log(`  (no individual failing audits; score is ${categoryScore} overall)`);
    return;
  }

  for (const { audit } of issues) {
    const value = audit.displayValue ? ` — ${audit.displayValue}` : '';
    console.log(`  ${formatAuditScore(audit.score).padStart(3)}  ${audit.title}${value}`);

    const items = audit.details?.items ?? [];
    for (const item of items.slice(0, 5)) {
      console.log(`        - ${formatAuditItem(item)}`);
    }
    if (items.length > 5) {
      console.log(`        ... +${items.length - 5} more`);
    }
  }
}

export function reportLighthouseResults({ run, report }) {
  console.log('\nLighthouse score summary:');
  for (const { key, label } of categories) {
    const score = Math.round((run.summary[key] ?? 0) * 100);
    console.log(`  ${label}: ${score}`);
  }

  const belowPerfect = categories.filter(
    ({ key }) => Math.round((run.summary[key] ?? 0) * 100) < 100,
  );
  if (!belowPerfect.length) {
    console.log('\nAll categories scored 100.\n');
    return;
  }

  console.log('\nDetails for categories below 100:');
  for (const { key, label } of belowPerfect) {
    const score = Math.round((run.summary[key] ?? 0) * 100);
    console.log(`\n${label} (${score}):`);
    reportCategoryIssues(report, key, score);
  }
  console.log('');
}

export function writeLighthouseBadges(run) {
  mkdirSync(badgesDir, { recursive: true });
  for (const { key, label, file } of categories) {
    const score = Math.round((run.summary[key] ?? 0) * 100);
    writeFileSync(
      resolve(badgesDir, file),
      `${JSON.stringify(toBadge(label, score), null, 2)}\n`,
    );
  }
}

const writeBadges = process.argv.includes('--write-badges');
const reportOnly = process.argv.includes('--report') || !writeBadges;

const { run, report } = loadRun();

if (reportOnly) {
  reportLighthouseResults({ run, report });
}

if (writeBadges) {
  writeLighthouseBadges(run);
}
