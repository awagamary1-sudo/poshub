const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function replaceInFile(relPath, replacements) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${relPath}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let count = 0;
  for (const [target, replacement] of replacements) {
    if (typeof target === 'string') {
      if (content.includes(target)) {
        content = content.split(target).join(replacement);
        count++;
      }
    } else if (target instanceof RegExp) {
      if (target.test(content)) {
        content = content.replace(target, replacement);
        count++;
      }
    }
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${relPath} (${count} replacement rule(s) applied)`);
}

// 1. HTML Pages
replaceInFile('api/src/routes/captain-setup.html', [
  ['Connect Captain · Posnic', 'Connect Captain · PosHub'],
]);

replaceInFile('api/src/routes/mobile-pos-setup.html', [
  ['aria-label="Posnic"', 'aria-label="PosHub"'],
  ['<p class="eyebrow">Posnic · Your mobile counter</p>', '<p class="eyebrow">PosHub · Your mobile counter</p>'],
]);

replaceInFile('api/src/kitchen-board/index.html', [
  ['Interactive Kitchen Display · Posnic', 'Interactive Kitchen Display · PosHub'],
  ['POSNIC / INTERACTIVE KITCHEN DISPLAY', 'POSHUB / INTERACTIVE KITCHEN DISPLAY'],
]);

replaceInFile('api/src/kitchen-board/manifest.webmanifest', [
  ['"name":"Posnic Kitchen"', '"name":"PosHub Kitchen"'],
]);

replaceInFile('frontend/static/manifest.webmanifest', [
  ['"name": "Posnic POS"', '"name": "PosHub POS"'],
  ['"short_name": "Posnic"', '"short_name": "PosHub"'],
]);

replaceInFile('frontend/static/probe.html', [
  ['<title>Posnic boot probe</title>', '<title>PosHub boot probe</title>'],
]);

replaceInFile('frontend/modules/settings_write.html', [
  ['<lang class="lang_ask_shared_knowledge">Posnic knowledge</lang>', '<lang class="lang_ask_shared_knowledge">PosHub knowledge</lang>'],
  ['normal Posnic permissions always apply.', 'normal PosHub permissions always apply.'],
  ['Leave a role list empty to rely on the normal Posnic permissions.', 'Leave a role list empty to rely on the normal PosHub permissions.'],
  ['Staff still need the matching Posnic permissions; this does not grant administrator access.', 'Staff still need the matching PosHub permissions; this does not grant administrator access.'],
  ['Managed AI uses your Posnic subscription and allowance.', 'Managed AI uses your PosHub subscription and allowance.'],
]);

replaceInFile('order/receipt.html', [
  ['Powered by <strong>Posnic</strong>', 'Powered by <strong>PosHub</strong>'],
]);

replaceInFile('order/thankyou.html', [
  ['Powered by Posnic &middot;', 'Powered by PosHub &middot;'],
]);

replaceInFile('src/hardware-manager.html', [
  ['https://yourshop.posnic.io/api', 'https://yourshop.posghana.shop/api'],
]);

replaceInFile('src/install-wizard.html', [
  ['<title>Posnic - First Time Setup</title>', '<title>PosHub - First Time Setup</title>'],
  ['<img src="../builds/512-posnic.png" alt="Posnic" class="wizard-logo">', '<img src="../builds/512-posnic.png" alt="PosHub" class="wizard-logo">'],
  ['<span class="setup-brand">Posnic</span>', '<span class="setup-brand">PosHub</span>'],
  ['Your Posnic account has been created successfully', 'Your PosHub account has been created successfully'],
  ['Ready to start using Posnic', 'Ready to start using PosHub'],
  ['<h2>How would you like to use Posnic?</h2>', '<h2>How would you like to use PosHub?</h2>'],
  ['Use <strong>Posnic Cloud</strong> or <strong>your own server</strong>.', 'Use <strong>PosHub Cloud</strong> or <strong>your own server</strong>.'],
  ['<p class="cloud-wordmark">Posnic Cloud</p>', '<p class="cloud-wordmark">PosHub Cloud</p>'],
  ['<p class="account-label">Already have a Posnic account?</p>', '<p class="account-label">Already have a PosHub account?</p>'],
  ['<div class="account-divider">New to Posnic?</div>', '<div class="account-divider">New to PosHub?</div>'],
  ['Already filled for Posnic Cloud. For your own server, use the address supplied with your code.', 'Already filled for PosHub Cloud. For your own server, use the address supplied with your code.'],
  ['Daily backups to Documents\\\\Posnic-Backups', 'Daily backups to Documents\\\\PosHub-Backups'],
  ["let backupPathValue = 'Documents\\\\Posnic-Backups';", "let backupPathValue = 'Documents\\\\PosHub-Backups';"],
  ["backupPath.value = 'Documents\\\\Posnic-Backups';", "backupPath.value = 'Documents\\\\PosHub-Backups';"],
]);

// 2. Frontend Scripts
replaceInFile('frontend/static/script/js/core/billing-outlets.js', [
  ["ui.current.name + ' - ' + data.branch.name + ' - Posnic';", "ui.current.name + ' - ' + data.branch.name + ' - PosHub';"],
]);

replaceInFile('frontend/static/script/js/core/command-palette.js', [
  ["name: 'About Posnic'", "name: 'About PosHub'"],
]);

replaceInFile('frontend/static/script/js/core/desktop-nudge.js', [
  ["Posnic runs better on the shop computer", "PosHub runs better on the shop computer"],
  ["veil.setAttribute('aria-label', 'The Posnic desktop app');", "veil.setAttribute('aria-label', 'The PosHub desktop app');"],
]);

replaceInFile('frontend/static/script/js/core/receipt-designer.js', [
  ['Made with Posnic · posghana.shop', 'Made with PosHub · posghana.shop'],
]);

replaceInFile('frontend/static/script/js/core/version-badge.js', [
  ["if (v.app) { return 'Posnic ' + v.app; }", "if (v.app) { return 'PosHub ' + v.app; }"],
  ["if (v.server) { return 'Posnic ' + v.server; }", "if (v.server) { return 'PosHub ' + v.server; }"],
  ["return 'Posnic';", "return 'PosHub';"],
  ["bits.push('Posnic ' + (v.app || v.server || '?'));", "bits.push('PosHub ' + (v.app || v.server || '?'));"],
]);

replaceInFile('frontend/static/script/js/modules/js/desktop-settings.js', [
  ["app: ['App Settings', 'Choose how Posnic starts on this computer.'],", "app: ['App Settings', 'Choose how PosHub starts on this computer.'],"],
  ["t('start_login', 'Start Posnic when I sign in to this computer')", "t('start_login', 'Start PosHub when I sign in to this computer')"],
  ["t('background_help', 'Closing the main window keeps Posnic running in the system tray. Kitchen printing and synchronization continue. Use Quit Posnic to stop the app.')", "t('background_help', 'Closing the main window keeps PosHub running in the system tray. Kitchen printing and synchronization continue. Use Quit PosHub to stop the app.')"],
  ["t('install_quit', 'Install updates when I close Posnic')", "t('install_quit', 'Install updates when I close PosHub')"],
  ["t('desktop_only', 'Open Posnic on this computer to manage connected devices and desktop settings.')", "t('desktop_only', 'Open PosHub on this computer to manage connected devices and desktop settings.')"],
]);

replaceInFile('frontend/static/script/js/modules/js/email-providers.js', [
  ["name:'Posnic cloud email'", "name:'PosHub cloud email'"],
  ["Use the email service managed by Posnic.", "Use the email service managed by PosHub."],
  ["Allow the public outbound IP of the Posnic sending server", "Allow the public outbound IP of the PosHub sending server"],
  ["Ask your Posnic administrator for this IP", "Ask your PosHub administrator for this IP"],
  ["{platform:'Managed by Posnic'", "{platform:'Managed by PosHub'"],
]);

replaceInFile('frontend/static/script/js/modules/js/extensions.js', [
  ["Unable to reach Posnic. Check the connection and retry.", "Unable to reach PosHub. Check the connection and retry."],
  ["close Posnic and reopen it to apply the package.", "close PosHub and reopen it to apply the package."],
  ["Install a signed package supplied by Posnic.", "Install a signed package supplied by PosHub."],
]);

replaceInFile('frontend/static/script/js/modules/js/messaging.js', [
  ["variable for the Posnic message.", "variable for the PosHub message."],
  ["The Posnic message fills body variable 1.", "The PosHub message fills body variable 1."],
]);

// 3. Kitchen Board Locales (44 JSON files)
const localesDir = path.join(ROOT, 'api/src/kitchen-board/locales');
if (fs.existsSync(localesDir)) {
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const filePath = path.join(localesDir, f);
    let str = fs.readFileSync(filePath, 'utf8');
    str = str.replace(/Posnic/g, 'PosHub');
    str = str.replace(/POSNIC/g, 'POSHUB');
    fs.writeFileSync(filePath, str, 'utf8');
  }
  console.log(`Updated all ${files.length} kitchen-board locale files`);
}

console.log('✅ UI/UX Posnic to PosHub text updates completed.');

