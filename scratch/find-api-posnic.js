const fs = require('fs');
const path = require('path');

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory() && f.name !== 'node_modules') walk(full);
    else if (f.isFile() && f.name.endsWith('.js')) {
      const txt = fs.readFileSync(full, 'utf8');
      const lines = txt.split('\n');
      lines.forEach((line, i) => {
        if (/['"`][^'"`]*posnic[^'"`]*['"`]/i.test(line)) {
          if (line.includes('require(') || line.includes('process.env.POSNIC') || line.includes('POSNIC_')) return;
          console.log(path.relative('.', full).replace(/\\/g, '/') + ':' + (i + 1) + ': ' + line.trim());
        }
      });
    }
  }
}
walk('api/src');

