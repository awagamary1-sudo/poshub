const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'frontend', 'modules');
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.html')) continue;
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const stripped = line.replace(/PosnicPro\.[a-zA-Z0-9_.]+/g, '').replace(/onclick="[^"]*"/g, '');
    if (/posnic/i.test(stripped)) {
      console.log(`${file}:${i + 1}: ${line.trim()}`);
    }
  });
}

