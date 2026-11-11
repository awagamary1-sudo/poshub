const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const results = [];

function checkFile(relPath) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) return;
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check if line contains Posnic or posnic in text/strings
    // Ignore require('...'), import, file paths if just referencing posnic.svg
    if (/posnic/i.test(line)) {
      results.push({
        file: relPath.replace(/\\/g, '/'),
        line: idx + 1,
        text: line.trim()
      });
    }
  });
}

// Check key HTML files
const htmlFiles = [
  'frontend/index.html',
  'frontend/login.html',
  'frontend/forgotpassword.html',
  'frontend/ssoauth.html',
  'frontend/dashboard.html',
  'frontend/layouts/header.html',
  'frontend/layouts/sidebar.html',
  'frontend/layouts/footer.html',
  'src/loading.html',
  'src/splash.html',
  'src/install-wizard.html',
  'src/backup-manager.html',
  'src/update-manager.html',
  'src/log-viewer.html',
  'src/support-request.html',
  'src/hardware-manager.html',
  'src/cloud-setup.html',
  'src/kitchen-screen.html',
  'src/kitchen-audio.html',
  'src/diagnostics.html'
];

htmlFiles.forEach(checkFile);

// Filter out pure PosnicPro code calls from HTML files
const uiMatches = results.filter(r => {
  const t = r.text;
  if (/onclick="PosnicPro\./.test(t)) return false;
  if (/<script/.test(t) && /PosnicPro\./.test(t)) return false;
  return true;
});

console.log(`Found ${uiMatches.length} candidate UI matches:`);
uiMatches.forEach(m => console.log(`${m.file}:${m.line} ${m.text}`));

