const fs = require('fs');
const path = require('path');

function checkDir(d) {
  if (!fs.existsSync(d)) return;
  for (const f of fs.readdirSync(d)) {
    const full = path.join(d, f);
    if (fs.statSync(full).isDirectory()) continue;
    if (!f.endsWith('.html')) continue;
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    lines.forEach((l, i) => {
      const stripped = l.replace(/class="[^"]*"/g, '')
                        .replace(/id="[^"]*"/g, '')
                        .replace(/src="[^"]*"/g, '')
                        .replace(/href="[^"]*"/g, '')
                        .replace(/PosnicPro\b/g, '')
                        .replace(/posnic_[a-z0-9_]+/gi, '')
                        .replace(/lang_[a-z0-9_]+/gi, '')
                        .replace(/data-t(-[a-z]+)?="[^"]*"/g, '')
                        .replace(/__posnic[a-z0-9_]+/gi, '');
      if (/\bposnic\b/i.test(stripped)) {
        console.log(`${full.replace(/\\/g, '/')}:${i+1} ${l.trim()}`);
      }
    });
  }
}

checkDir('frontend');
checkDir('frontend/layouts');
checkDir('frontend/modules');
checkDir('order');
checkDir('menu');

