const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..'); // POS-develop
const skipDirs = new Set(['node_modules', '.git', 'dist', 'bin', 'data', 'log', 'coverage', 'uploads']);

const results = [];

function search(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      search(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.js', '.html', '.css', '.json', '.md', '.txt', '.sh', '.bat', '.ps1'].includes(ext)) continue;
      // Skip api-runtime zip or large files
      try {
        const stat = fs.statSync(full);
        if (stat.size > 2 * 1024 * 1024) continue; // skip files > 2MB
        const text = fs.readFileSync(full, 'utf8');
        const posnicMatches = text.match(/\bposnic\b/gi);
        if (posnicMatches) {
          results.push({
            file: path.relative(root, full).replace(/\\/g, '/'),
            count: posnicMatches.length,
            sample: text.split('\n').filter(l => /\bposnic\b/i.test(l)).slice(0, 5)
          });
        }
      } catch (e) {}
    }
  }
}

search(root);
console.log(`Found ${results.length} files containing 'posnic'.`);
fs.writeFileSync(path.join(__dirname, 'posnic-matches.json'), JSON.stringify(results, null, 2));
console.log('Saved to scratch/posnic-matches.json');
