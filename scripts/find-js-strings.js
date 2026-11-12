const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) res = res.concat(walk(p));
    else if (e.name.endsWith('.js')) res.push(p);
  }
  return res;
}

const files = walk('frontend/static/script/js');
const matches = [];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    // Only look at lines containing Posnic or POSNIC as a word
    if (/\b(Posnic|POSNIC)\b/.test(line)) {
      // Exclude technical identifiers
      if (!line.includes('PosnicPro') &&
          !line.includes('posnic_') &&
          !line.includes('.posnic.svg') &&
          !line.includes('lang_') &&
          !line.includes('__posnic')) {
        matches.push({
          file: file.replace(/\\/g, '/'),
          line: idx + 1,
          text: line.trim()
        });
      }
    }
  });
}

console.log(`Found ${matches.length} JS line matches:`);
matches.forEach(m => console.log(`${m.file}:${m.line} -> ${m.text}`));
fs.writeFileSync('scripts/js-string-matches.json', JSON.stringify(matches, null, 2));
