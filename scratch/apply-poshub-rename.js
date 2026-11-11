const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function replaceInFile(relPath, replacements) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) {
    console.log(`File not found: ${relPath}`);
    return;
  }
  let content = fs.readFileSync(full, 'utf8');
  let changed = false;
  for (const [target, replacement] of replacements) {
    if (content.includes(target)) {
      content = content.split(target).join(replacement);
      changed = true;
      console.log(`Replaced in ${relPath}: "${target}" -> "${replacement}"`);
    } else {
      console.log(`Target not found in ${relPath}: "${target}"`);
    }
  }
  if (changed) {
    fs.writeFileSync(full, content, 'utf8');
  }
}

// 1. frontend/modules/settings_write.html
replaceInFile('frontend/modules/settings_write.html', [
  ['placeholder="https://example.com/posnic-hook"', 'placeholder="https://example.com/poshub-hook"'],
  ["use Posnic's cloud email", "use PosHub's cloud email"]
]);

// 2. frontend/login.html
replaceInFile('frontend/login.html', [
  ['Another posnic account ?', 'Another PosHub account ?']
]);

// 3. frontend/layouts/header.html
replaceInFile('frontend/layouts/header.html', [
  ["The shop's account with Posnic", "The shop's account with PosHub"]
]);

// 4. frontend/layouts/footer.html
replaceInFile('frontend/layouts/footer.html', [
  ['Posnic Innovations Pvt', 'PosHub Innovations Pvt']
]);

// 5. src/main.js
replaceInFile('src/main.js', [
  ['=== Posnic Daily Log:', '=== PosHub Daily Log:'],
  ["'Could not reach Posnic. Check the internet connection.'", "'Could not reach PosHub. Check the internet connection.'"],
  ["'Could not reach Posnic Cloud. Check your internet connection and try again.'", "'Could not reach PosHub Cloud. Check your internet connection and try again.'"],
  ["'That does not look like a Posnic API token'", "'That does not look like a PosHub API token'"],
  ["'Choose whether to start Posnic at login.'", "'Choose whether to start PosHub at login.'"],
  ['`Posnic   ${s.app}`', '`PosHub   ${s.app}`'],
  ['<div class="n">Posnic is free software under the <b>GNU AGPL-3.0</b>.', '<div class="n">PosHub is free software under the <b>GNU AGPL-3.0</b>.'],
  ['unless you connect Posnic Cloud.', 'unless you connect PosHub Cloud.'],
  ['<p>Please install the latest Posnic build.</p>', '<p>Please install the latest PosHub build.</p>'],
  ['console.log(`   Posnic for ${PLATFORM_NAME}`);', 'console.log(`   PosHub for ${PLATFORM_NAME}`);'],
  ['and contact Posnic support.', 'and contact PosHub support.'],
  ['Posnic itself is running normally.', 'PosHub itself is running normally.'],
  ['or the next time Posnic starts.', 'or the next time PosHub starts.'],
  ['Windows Firewall now allows Posnic to accept connections', 'Windows Firewall now allows PosHub to accept connections'],
  ["startupError: 'Posnic could not start its local database', details: 'Posnic includes its own database. Your data has not been removed. Open Log for details or restart Posnic to try again.'", "startupError: 'PosHub could not start its local database', details: 'PosHub includes its own database. Your data has not been removed. Open Log for details or restart PosHub to try again.'"],
  ["startupError: 'Posnic could not start'", "startupError: 'PosHub could not start'"]
]);

// 6. src/diagnostics.html
replaceInFile('src/diagnostics.html', [
  ['<title>Posnic Support</title>', '<title>PosHub Support</title>'],
  ['<h1>Posnic Support</h1>', '<h1>PosHub Support</h1>'],
  ['<p>Follow the steps below, then use Posnic as usual.</p>', '<p>Follow the steps below, then use PosHub as usual.</p>'],
  ['<h2 tabindex="-1">Step 3 - Use Posnic as usual</h2>', '<h2 tabindex="-1">Step 3 - Use PosHub as usual</h2>'],
  ['You can keep this window open while using Posnic.', 'You can keep this window open while using PosHub.']
]);

// 7. src/diagnostics-ui.js
replaceInFile('src/diagnostics-ui.js', [
  ['Use Posnic as usual', 'Use PosHub as usual']
]);

// 8. src/log-viewer.html
replaceInFile('src/log-viewer.html', [
  ['<title>Application Log | Posnic</title>', '<title>Application Log | PosHub</title>']
]);

// 9. src/cloud-setup.html
replaceInFile('src/cloud-setup.html', [
  ['<title>Posnic Cloud</title>', '<title>PosHub Cloud</title>'],
  ['<h1>☁️ Posnic Cloud</h1>', '<h1>☁️ PosHub Cloud</h1>'],
  ['<h3>Connect this machine to Posnic Cloud</h3>', '<h3>Connect this machine to PosHub Cloud</h3>'],
  ['Disconnect this device from Posnic Cloud?', 'Disconnect this device from PosHub Cloud?']
]);

// 10. src/backup-manager.html
replaceInFile('src/backup-manager.html', [
  ['🕒 Backups when Posnic is closed', '🕒 Backups when PosHub is closed'],
  ['while Posnic is open', 'while PosHub is open'],
  ['same Windows user Posnic normally runs as', 'same Windows user PosHub normally runs as']
]);

// 11. src/hardware-manager.html
replaceInFile('src/hardware-manager.html', [
  ['Every Posnic installation makes its own printing key', 'Every PosHub installation makes its own printing key'],
  ['Posnic does not change these Windows settings', 'PosHub does not change these Windows settings'],
  ['Posnic prevents automatic system sleep', 'PosHub prevents automatic system sleep'],
  ['Keep Posnic running', 'Keep PosHub running'],
  ['Restart Posnic after installing.', 'Restart PosHub after installing.']
]);

// 12. src/update-manager.html
replaceInFile('src/update-manager.html', [
  ['already installed — Posnic only moves forwards', 'already installed — PosHub only moves forwards'],
  ['"install when I close Posnic"', '"install when I close PosHub"']
]);

// 13. src/support-request.html
replaceInFile('src/support-request.html', [
  ['(Posnic support)', '(PosHub support)'],
  ['your Posnic provider', 'your PosHub provider']
]);

// 14. src/browser-cloud-auth.js
replaceInFile('src/browser-cloud-auth.js', [
  ['Return to Posnic Desktop.', 'Return to PosHub Desktop.'],
  ['<title>Computer authorized · Posnic</title>', '<title>Computer authorized · PosHub</title>'],
  ['<div class="brand">Posnic</div>', '<div class="brand">PosHub</div>'],
  ["We're bringing Posnic back to the front", "We're bringing PosHub back to the front"],
  ['<a href="posnic://open">Open Posnic</a>', '<a href="poshub://open">Open PosHub</a>'],
  ['If Posnic stays behind your browser, use the button or select Posnic from your taskbar.', 'If PosHub stays behind your browser, use the button or select PosHub from your taskbar.'],
  ['Return to Posnic Desktop and retry.', 'Return to PosHub Desktop and retry.']
]);

// 15. src/cloud-local-reset.js
replaceInFile('src/cloud-local-reset.js', [
  ['Another Posnic installation is using this database port.', 'Another PosHub installation is using this database port.'],
  ['Restart Posnic before deleting local data.', 'Restart PosHub before deleting local data.']
]);

// 16. src/sync-agent-manager.js
replaceInFile('src/sync-agent-manager.js', [
  ["'Posnic Cloud sync is offline'", "'PosHub Cloud sync is offline'"],
  ["'Posnic Cloud sync restored'", "'PosHub Cloud sync restored'"]
]);

// 17. src/windows-printer-transport.js
replaceInFile('src/windows-printer-transport.js', [
  ['A separate Posnic printer keep-alive helper is running.', 'A separate PosHub printer keep-alive helper is running.']
]);

// 18. src/bill-manager.js
replaceInFile('src/bill-manager.js', [
  ["'Posnic Bill'", "'PosHub Bill'"]
]);

// 19. api/src/v1/index.js
replaceInFile('api/src/v1/index.js', [
  ["title: 'Posnic API'", "title: 'PosHub API'"]
]);

// 20. api/src/config/config.js
replaceInFile('api/src/config/config.js', [
  ["sender: process.env.SMS_SENDER || 'POSNIC'", "sender: process.env.SMS_SENDER || 'POSHUB'"]
]);

// 21. api/src/utils/email.js
replaceInFile('api/src/utils/email.js', [
  ["const brandName = process.env.WHITE_LABEL_NAME || 'Posnic';", "const brandName = process.env.WHITE_LABEL_NAME || 'PosHub';"],
  ["Welcome to ${process.env.WHITE_LABEL_NAME || 'Posnic'}!", "Welcome to ${process.env.WHITE_LABEL_NAME || 'PosHub'}!"],
  ["${process.env.WHITE_LABEL_NAME || 'Posnic'}", "${process.env.WHITE_LABEL_NAME || 'PosHub'}"]
]);

// 22. api/src/utils/email-layout.js
replaceInFile('api/src/utils/email-layout.js', [
  ['"Powered by Posnic"', '"Powered by PosHub"'],
  ["name: whiteLabelName || 'Posnic'", "name: whiteLabelName || 'PosHub'"],
  ['Powered by Posnic', 'Powered by PosHub']
]);

// 23. api/src/controllers/messaging.controller.js
replaceInFile('api/src/controllers/messaging.controller.js', [
  ["subject: 'Posnic email delivery test'", "subject: 'PosHub email delivery test'"],
  ["text: 'This is a test from your Posnic email settings. No payment or action is required.'", "text: 'This is a test from your PosHub email settings. No payment or action is required.'"],
  ["report.answer = 'POSNIC TEST - report delivery check.\\n' + report.answer;", "report.answer = 'POSHUB TEST - report delivery check.\\n' + report.answer;"]
]);

// 24. api/src/controllers/receivings.controller.js
replaceInFile('api/src/controllers/receivings.controller.js', [
  ["const shopName = branch.branch_name || 'Posnic POS';", "const shopName = branch.branch_name || 'PosHub POS';"]
]);

// 25. api/src/services/whatsapp.service.js
replaceInFile('api/src/services/whatsapp.service.js', [
  ["deviceName: 'Posnic'", "deviceName: 'PosHub'"]
]);

// 26. api/src/services/messaging.service.js
replaceInFile('api/src/services/messaging.service.js', [
  ["name: 'Posnic TEST'", "name: 'PosHub TEST'"]
]);

// 27. api/src/services/mobile-pos.js
replaceInFile('api/src/services/mobile-pos.js', [
  ["name: c.branch.company_name || c.branch.branch_name || 'Posnic'", "name: c.branch.company_name || c.branch.branch_name || 'PosHub'"]
]);

// 28. api/src/services/shop-email.js
replaceInFile('api/src/services/shop-email.js', [
  ["'Choose SMTP, API or PosHub email.'", "'Choose SMTP, API or PosHub email.'"],
  ["'Choose SMTP, API or Posnic email.'", "'Choose SMTP, API or PosHub email.'"],
  ["'This email provider does not support API sending in Posnic.'", "'This email provider does not support API sending in PosHub.'"]
]);

// 29. api/src/services/wording-profiles.js
replaceInFile('api/src/services/wording-profiles.js', [
  ["module: 'Posnic'", "module: 'PosHub'"],
  ["'This profile requires a newer Posnic version'", "'This profile requires a newer PosHub version'"]
]);

// 30. api/src/controllers/ask-posnic.controller.js
replaceInFile('api/src/controllers/ask-posnic.controller.js', [
  ["'Ask Posnic is available' : 'Ask Posnic is off'", "'Ask PosHub is available' : 'Ask PosHub is off'"],
  ["message: `Ask Posnic ${capability} are not enabled for your role.`", "message: `Ask PosHub ${capability} are not enabled for your role.`"],
  ["source: 'Posnic feature catalog'", "source: 'PosHub feature catalog'"],
  [". Other operations use their module pages. Normal Posnic permissions and enabled features apply.", ". Other operations use their module pages. Normal PosHub permissions and enabled features apply."],
  ["message: 'Posnic capabilities'", "message: 'PosHub capabilities'"],
  ["Ask an owner to review Ask Posnic Access & actions and your normal module permissions.", "Ask an owner to review Ask PosHub Access & actions and your normal module permissions."],
  ["message: 'Ask Posnic could not load the answer.'", "message: 'Ask PosHub could not load the answer.'"],
  ["message: 'Ask Posnic audit history'", "message: 'Ask PosHub audit history'"],
  ["message: 'Ask Posnic actions are not enabled for your role.'", "message: 'Ask PosHub actions are not enabled for your role.'"],
  ["message: 'That Ask Posnic action is disabled.'", "message: 'That Ask PosHub action is disabled.'"],
  ["notes: 'Prepared by Ask Posnic'", "notes: 'Prepared by Ask PosHub'"],
  ["message: 'Ask Posnic preferences'", "message: 'Ask PosHub preferences'"],
  ["message: 'Ask Posnic preferences saved.'", "message: 'Ask PosHub preferences saved.'"]
]);

console.log('Finished apply-poshub-rename.js');

