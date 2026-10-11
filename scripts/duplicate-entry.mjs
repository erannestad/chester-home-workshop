// Copies a CMS entry as a hidden draft. Run by .github/workflows/duplicate-entry.yml
// from the "Make a copy" button in Pages CMS, which passes its payload as JSON.
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ALLOWED_DIRS = ['src/content/products'];

const payload = JSON.parse(process.env.PAYLOAD || '{}');
const source = payload.context?.path ?? '';
const dir = dirname(source);

if (!ALLOWED_DIRS.includes(dir) || !/^[a-z0-9-]+\.md$/i.test(source.slice(dir.length + 1))) {
  throw new Error(`Refusing to copy "${source}".`);
}

const text = readFileSync(source, 'utf8');
const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)?$/);
if (!match) throw new Error(`${source} has no frontmatter.`);
let [, frontmatter, body = ''] = match;

const oldTitle = frontmatter.match(/^title:\s*(.*)$/m)?.[1].replace(/^(['"])(.*)\1$/, '$2') ?? '';
const title = String(payload.inputs?.title ?? '').trim() || `${oldTitle} (copy)`;

const setField = (fm, key, value) => {
  const line = `${key}: ${value}`;
  const re = new RegExp(`^${key}:.*$`, 'm');
  return re.test(fm) ? fm.replace(re, line) : `${fm}\n${line}`;
};
frontmatter = setField(frontmatter, 'title', JSON.stringify(title));
frontmatter = setField(frontmatter, 'draft', 'true');

const slug =
  title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'copy';

let target = join(dir, `${slug}.md`);
for (let n = 2; existsSync(target); n++) target = join(dir, `${slug}-${n}.md`);

writeFileSync(target, `---\n${frontmatter}\n---${body}`);
console.log(`Copied ${source} to ${target}`);

if (process.env.GITHUB_OUTPUT) {
  const by = payload.triggeredBy ?? {};
  const oneLine = (v) => String(v ?? '').replace(/[\r\n<>]+/g, ' ').trim();
  const email = oneLine(by.email);
  const name = oneLine(by.name) || email;
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `target=${target}\nauthor_name=${name}\nauthor_email=${email}\n`,
  );
}
