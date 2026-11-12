const fs = require('fs');
const path = require('path');

function walk(dir, exts) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'public' || e.name === 'dist' || e.name === 'poshub-online') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) res = res.concat(walk(full, exts));
    else if (exts.some(ext => e.name.endsWith(ext))) res.push(full);
  }
  return res;
}

const targetFiles = [
  ...walk('frontend', ['.html', '.js']),
  ...walk('order', ['.html', '.js']),
  ...walk('menu', ['.html', '.js']),
  ...walk('src', ['.html', '.js'])
];

const matches = [];
for (const file of targetFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/posnic/i.test(line)) {
      // Filter out technical occurrences
      const stripped = line
        .replace(/PosnicPro\b/g, '')
        .replace(/posnic_jwt_token/g, '')
        .replace(/posnic_auth/g, '')
        .replace(/posnic_user/g, '')
        .replace(/posnic_web_ok/g, '')
        .replace(/posnic_business_approval/g, '')
        .replace(/data-t(-[a-z]+)?="lang_[^"]*"/g, '')
        .replace(/lang_[a-z0-9_]+/g, '')
        .replace(/class="[^"]*"/g, '')
        .replace(/id="[^"]*"/g, '')
        .replace(/src="[^"]*"/g, '')
        .replace(/href="[^"]*"/g, '');

      // Check if visible "Posnic" or "POSNIC" remains
      if (/posnic/i.test(stripped)) {
        matches.push({
          file: file.replace(/\\/g, '/'),
          line: idx + 1,
          raw: line.trim()
        });
      }
    }
  });
}

console.log(`Found ${matches.length} candidate UI matches:`);
matches.forEach(m => console.log(`${m.file}:${m.line} -> ${m.raw}`));
fs.writeFileSync('scripts/ui-posnic-matches.json', JSON.stringify(matches, null, 2));

