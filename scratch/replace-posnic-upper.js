const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function replaceInFile(relPath, pairs) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) {
    console.log(`File not found: ${relPath}`);
    return;
  }
  let content = fs.readFileSync(full, 'utf8');
  let changed = false;
  for (const [target, replacement] of pairs) {
    if (content.includes(target)) {
      content = content.split(target).join(replacement);
      changed = true;
      console.log(`[${relPath}] replaced "${target}" -> "${replacement}"`);
    } else {
      console.log(`[${relPath}] NOT found: "${target}"`);
    }
  }
  if (changed) {
    fs.writeFileSync(full, content, 'utf8');
  }
}

// 1. builds/installer.nsh
replaceInFile('builds/installer.nsh', [
  ['$POSNIC_REMOVAL_SUMMARY', '$POSHUB_REMOVAL_SUMMARY'],
  ['Var POSNIC_REPAIR_MODE', 'Var POSHUB_REPAIR_MODE'],
  ['Var POSNIC_START_MENU_FOLDER', 'Var POSHUB_START_MENU_FOLDER'],
  ['Var POSNIC_KEEP_BUSINESS', 'Var POSHUB_KEEP_BUSINESS'],
  ['Var POSNIC_KEEP_HARDWARE', 'Var POSHUB_KEEP_HARDWARE'],
  ['Var POSNIC_KEEP_BACKUPS', 'Var POSHUB_KEEP_BACKUPS'],
  ['Var POSNIC_BUSINESS_CHECK', 'Var POSHUB_BUSINESS_CHECK'],
  ['Var POSNIC_HARDWARE_CHECK', 'Var POSHUB_HARDWARE_CHECK'],
  ['Var POSNIC_REMOVE_ALL_CHECK', 'Var POSHUB_REMOVE_ALL_CHECK'],
  ['Var POSNIC_BACKUPS_CHECK', 'Var POSHUB_BACKUPS_CHECK'],
  ['Var POSNIC_REMOVAL_SUMMARY', 'Var POSHUB_REMOVAL_SUMMARY'],
  ['Var POSNIC_POWERSHELL', 'Var POSHUB_POWERSHELL'],
  ['$POSNIC_START_MENU_FOLDER', '$POSHUB_START_MENU_FOLDER'],
  ['$POSNIC_REPAIR_MODE', '$POSHUB_REPAIR_MODE'],
  ['$POSNIC_KEEP_BUSINESS', '$POSHUB_KEEP_BUSINESS'],
  ['$POSNIC_KEEP_HARDWARE', '$POSHUB_KEEP_HARDWARE'],
  ['$POSNIC_KEEP_BACKUPS', '$POSHUB_KEEP_BACKUPS'],
  ['$POSNIC_REMOVE_ALL_CHECK', '$POSHUB_REMOVE_ALL_CHECK'],
  ['$POSNIC_BUSINESS_CHECK', '$POSHUB_BUSINESS_CHECK'],
  ['$POSNIC_HARDWARE_CHECK', '$POSHUB_HARDWARE_CHECK'],
  ['$POSNIC_BACKUPS_CHECK', '$POSHUB_BACKUPS_CHECK'],
  ['$POSNIC_POWERSHELL', '$POSHUB_POWERSHELL'],
  ['!macro POSNIC_VERIFY_REMOVAL', '!macro POSHUB_VERIFY_REMOVAL'],
  ['!insertmacro POSNIC_VERIFY_REMOVAL', '!insertmacro POSHUB_VERIFY_REMOVAL']
]);

console.log('Finished replace-posnic-upper.js');

