const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scripts/ui-posnic-matches.json', 'utf8'));

// Filter for HTML files or JS files where visible strings are presented to users
const htmlMatches = data.filter(m => m.file.endsWith('.html'));

console.log(`Total HTML matches: ${htmlMatches.length}`);
htmlMatches.forEach(m => {
  console.log(`${m.file}:${m.line} -> ${m.raw}`);
});

