; Posnic - Custom NSIS Installer Script
; This script is included during the installation process

; Let electron-builder control compression of its already archived payload.
; Solid recompression breaks its installer-size validation and slows extraction.
SetDatablockOptimize on

; The file list stays visible - a shop watching an installer that says nothing
; for two minutes assumes it has hung.
;
; Colours are ink on white rather than the green-on-black this used to be. That
; scheme reads as a terminal from 1998, and the setup wizard is the first thing
; anyone sees of this product. Foreground first, then background.
!define MUI_INSTFILESPAGE_COLORS "1F2937 FFFFFF"
!define MUI_INSTFILESPAGE_PROGRESSBAR "smooth"

; Wording on the welcome and finish pages. The defaults are electron-builder's
; generic strings; a shop installing a till reads these once, and they are the
; only chance to say what this is and what to expect.
;
; $\r$\n is NSIS's line break. It has to reach makensis as those characters -
; writing a real carriage return here ends the string early and the build fails
; with "unterminated string".
; THE SAME SCRIPT IS COMPILED TWICE: once for the installer, once for the
; uninstaller (electron-builder defines BUILD_UNINSTALLER for the second
; pass). These page texts used to be defined once, so the uninstaller's
; finish page announced "Posnic is installed" at the end of an uninstall.
; Owner: "i saw message like pos installed on the end while uninstalled."
!ifdef BUILD_UNINSTALLER
  !define MUI_WELCOMEPAGE_TITLE "Remove PosHub"
  !define MUI_WELCOMEPAGE_TEXT "This removes the PosHub application from this computer.$\r$\n$\r$\nChoose which business data, hardware settings and backups to keep on the next screen.$\r$\n$\r$\nClose any running copy of PosHub before continuing."
  !define MUI_FINISHPAGE_TITLE "PosHub is removed"
  !define MUI_FINISHPAGE_TEXT "$POSHUB_REMOVAL_SUMMARY"
!else
  !define MUI_WELCOMEPAGE_TITLE "Welcome to PosHub"
  !define MUI_WELCOMEPAGE_TEXT "PosHub is a point of sale that works without internet. Your sales, stock and customers stay on this computer.$\r$\n$\r$\nSetup installs the application and its database. The first launch takes a few minutes while the database is prepared; later launches take seconds.$\r$\n$\r$\nClose any running copy of PosHub before continuing."
  ; Kept short on purpose. MUI gives the finish page a fixed text area above the
  ; "run now" checkbox and silently clips whatever does not fit - the first
  ; version of this ended mid-sentence at "your data is on this".
  !define MUI_FINISHPAGE_TITLE "PosHub is installed"
  !define MUI_FINISHPAGE_TEXT "The first launch prepares the database and opens the setup wizard, where you name your shop and create an administrator account.$\r$\n$\r$\nKeep that password safe. Your data lives on this machine."
  !define MUI_FINISHPAGE_RUN_TEXT "Start PosHub now"
!endif




; Ensure install/uninstall details (file list) are always visible
ShowInstDetails show
ShowUninstDetails show

; common.nsh is loaded after this include and sets nevershow. Override it
; in the late header hook, after electron-builder has declared its pages.
!macro customHeader
  ShowInstDetails show
  ShowUninstDetails show
!macroend

Var POSHUB_REPAIR_MODE
Var POSHUB_START_MENU_FOLDER
Var POSHUB_KEEP_BUSINESS
Var POSHUB_KEEP_HARDWARE
Var POSHUB_KEEP_BACKUPS
Var POSHUB_BUSINESS_CHECK
Var POSHUB_HARDWARE_CHECK
Var POSHUB_REMOVE_ALL_CHECK
Var POSHUB_BACKUPS_CHECK
Var POSHUB_REMOVAL_SUMMARY
Var POSHUB_POWERSHELL
!include nsDialogs.nsh
!include LogicLib.nsh
!include x64.nsh
; electron-builder loads custom includes before its assisted UI template.
; Our page functions use MUI_HEADER_TEXT while this file is parsed.
!include MUI2.nsh

; Posnic stores its runtime and user-specific data under the current profile.
; Force per-user installation and skip the redundant all-users/current-user page.
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

; Add a Start Menu folder selection step after the install-location page.
; Existing branding, icons, install logic, and finish page remain unchanged.
!macro customPageAfterChangeDir
  !define MUI_STARTMENUPAGE_DEFAULTFOLDER "PosHub"
  !define MUI_STARTMENUPAGE_REGISTRY_ROOT "HKCU"
  !define MUI_STARTMENUPAGE_REGISTRY_KEY "Software\PosHub"
  !define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "Start Menu Folder"
  !insertmacro MUI_PAGE_STARTMENU PosHub $POSHUB_START_MENU_FOLDER
!macroend

; Detect same-machine repair/install-over-existing before files are replaced
!macro customInit
  StrCpy $POSHUB_REPAIR_MODE "0"
  IfFileExists "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 repair_mode_done
    StrCpy $POSHUB_REPAIR_MODE "1"
  repair_mode_done:
  ; Preserve legacy uploaded images BEFORE the old uninstaller replaces binaries.
  IfFileExists "$INSTDIR\resources\api\uploads\*" 0 uploads_migration_done
    InitPluginsDir
    File /oname=$PLUGINSDIR\migrate-uploads.ps1 "${BUILD_RESOURCES_DIR}\migrate-uploads.ps1"
    nsExec::ExecToStack '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$PLUGINSDIR\migrate-uploads.ps1" -Source "$INSTDIR\resources\api\uploads" -Destination "$APPDATA\posnic\uploads"'
    Pop $0
    Pop $1
    ${If} $0 != 0
      MessageBox MB_OK|MB_ICONSTOP "Could not preserve uploaded images. Setup has stopped before replacing the application. $1" /SD IDOK
      Abort
    ${EndIf}
  uploads_migration_done:
!macroend

; Custom installation messages
!macro customInstall
  ; What the shop is getting, on the line above the progress bar while the
  ; last of the install finishes.
  ;
  ; textonly writes to that line without adding to the file list, so it reads
  ; as status rather than log noise. Nothing here sleeps: padding the install
  ; to make a message linger would trade a slower setup for a prettier one,
  ; which is the wrong way round.
  SetDetailsPrint textonly
  DetailPrint "Preparing your database and setting up the till..."
  SetDetailsPrint both
  DetailPrint "========================================="
  DetailPrint "PosHub Installation Starting"
  DetailPrint "Installation started at: $\r$\n"
  DetailPrint "========================================="

  StrCmp $POSHUB_REPAIR_MODE "1" repair_mode_detected normal_install_mode
  repair_mode_detected:
    DetailPrint "REPAIR MODE DETECTED"
    DetailPrint "Repairing PosHub application files..."
    DetailPrint "Database and backups will be kept."
    Goto install_mode_done
  normal_install_mode:
    DetailPrint "INSTALL/UPDATE MODE"
  install_mode_done:
  IfSilent setup_review_done
    CreateDirectory "$APPDATA\PosHub"
    FileOpen $0 "$APPDATA\PosHub\.setup-review" w
    FileWrite $0 "manual-install"
    FileClose $0
  setup_review_done:
  
  ; ── Close any running instance of PosHub before installing ──
  DetailPrint "[TIME CHECK] Step 1 START: Process termination"
  
  ; Kill all possible process names (fast mode)
  DetailPrint "Terminating running instances..."
  nsExec::ExecToLog 'taskkill /F /IM "PosHub.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "poshub.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "Posnic.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "posnic.exe" /T'
  
  ; Minimal wait for process termination
  DetailPrint "Waiting 500ms for process cleanup..."
  Sleep 500
  
  DetailPrint "[TIME CHECK] Step 1 COMPLETE: Process termination done"

  DetailPrint "[TIME CHECK] Step 2 START: File extraction"
  DetailPrint "Installing PosHub files..."
  DetailPrint "Target: $INSTDIR"
  DetailPrint "This may take 10-60 seconds depending on disk speed..."
  
  ; Note: File extraction happens here automatically by NSIS
  ; We can't add timing in the middle, but we'll time before/after
  
  DetailPrint "[TIME CHECK] Step 3 START: Shortcuts creation"
  
  DetailPrint "Creating desktop shortcut..."
  CreateShortcut "$DESKTOP\PosHub.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\resources\app.ico" 0
  
  DetailPrint "Creating start menu shortcut..."
  ; electron-builder creates its default link before customInstall. Replace only
  ; that Start Menu link with the folder selected on the wizard page.
  Delete "$newStartMenuLink"
  RMDir "$SMPROGRAMS\PosHub"
  RMDir "$SMPROGRAMS\Posnic"
  !insertmacro MUI_STARTMENU_WRITE_BEGIN PosHub
    CreateDirectory "$SMPROGRAMS\$POSHUB_START_MENU_FOLDER"
    CreateShortcut "$SMPROGRAMS\$POSHUB_START_MENU_FOLDER\PosHub.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\resources\app.ico" 0
    StrCpy $newStartMenuLink "$SMPROGRAMS\$POSHUB_START_MENU_FOLDER\PosHub.lnk"
    StrCpy $launchLink "$newStartMenuLink"
    WriteRegStr SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" MenuDirectory "$POSHUB_START_MENU_FOLDER"
  !insertmacro MUI_STARTMENU_WRITE_END
  CreateDirectory "$DOCUMENTS\PosHub-Backups"
  !insertmacro MUI_STARTMENU_WRITE_BEGIN PosHub
    CreateShortcut "$SMPROGRAMS\$POSHUB_START_MENU_FOLDER\Open PosHub Backups.lnk" "$WINDIR\explorer.exe" "$DOCUMENTS\PosHub-Backups"
  !insertmacro MUI_STARTMENU_WRITE_END
  
  DetailPrint "[TIME CHECK] Step 3 COMPLETE: Shortcuts created"
  
  DetailPrint "[TIME CHECK] Step 4 START: Registry configuration"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "PosHub" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  DetailPrint "[TIME CHECK] Step 4 COMPLETE: Registry configured"
  
  DetailPrint "========================================="
  DetailPrint "Installation completed successfully!"
  DetailPrint "Total time: Check timestamps above"
  DetailPrint "========================================="
  
  ; Auto-restart app after update installation (silent mode only)
  DetailPrint "[TIME CHECK] Step 5 START: Auto-restart check"
  
  ; Check if installer is running in silent mode (update scenario)
  ; Silent mode = auto-update from running app
  ; Normal mode = user manually installing
  IfSilent is_silent_update is_manual_install
  
  is_silent_update:
    DetailPrint "SILENT UPDATE MODE - Auto-restart enabled"
    DetailPrint "Waiting 1 second before app launch..."
    Sleep 1000
    DetailPrint "[TIME CHECK] Step 6 START: App launch"
    DetailPrint "Launching: $INSTDIR\${APP_EXECUTABLE_FILENAME}"
    
    ; Use Exec to launch app in background (detached process)
    ; This ensures app starts and continues running after installer exits
    Exec '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
    
    DetailPrint "[TIME CHECK] Step 6 COMPLETE: App launched successfully"
    DetailPrint "App is now running in background"
    DetailPrint "Installer will close automatically in 2 seconds"
    Sleep 2000
    Goto end_restart_check
  
  is_manual_install:
    StrCmp $POSHUB_REPAIR_MODE "1" is_manual_repair is_manual_fresh_install

  is_manual_repair:
    DetailPrint "REPAIR MODE - Auto-restart enabled"
    DetailPrint "Waiting 1 second before app launch..."
    Sleep 1000
    DetailPrint "[TIME CHECK] Step 6 START: Repair app launch"
    DetailPrint "Launching: $INSTDIR\${APP_EXECUTABLE_FILENAME}"
    Exec '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
    DetailPrint "[TIME CHECK] Step 6 COMPLETE: Repaired app launched successfully"
    DetailPrint "Database was kept. Shortcuts were recreated."
    Goto end_restart_check

  is_manual_fresh_install:
    DetailPrint "MANUAL INSTALL - User will launch app manually"
    DetailPrint "Click desktop shortcut or start menu to launch PosHub"
  
  end_restart_check:
  DetailPrint "[TIME CHECK] Installation process finished"
!macroend

; Preserve everything during silent upgrades. The normal uninstall has three
; independent keep choices, matching the desktop setup design.
!macro customUnInit
  StrCpy $POSHUB_KEEP_BUSINESS "1"
  StrCpy $POSHUB_KEEP_HARDWARE "1"
  StrCpy $POSHUB_KEEP_BACKUPS "1"
  StrCpy $POSHUB_REMOVAL_SUMMARY "The application was removed. Business data, hardware settings and backups were kept."
!macroend

!macro customUnWelcomePage
  !insertmacro MUI_UNPAGE_WELCOME
  UninstPage custom un.PosnicDataPage un.PosnicDataLeave
!macroend

!ifdef BUILD_UNINSTALLER
Function un.PosnicDataPage
  IfSilent 0 +2
    Abort
  !insertmacro MUI_HEADER_TEXT "Remove PosHub?" "The application will be removed. Choose what to keep."
  nsDialogs::Create 1018
  Pop $0
  ${NSD_CreateCheckbox} 0 0u 100% 18u "Remove all local data"
  Pop $POSHUB_REMOVE_ALL_CHECK
  ${NSD_OnClick} $POSHUB_REMOVE_ALL_CHECK un.PosnicRemoveAllClick
  ${NSD_CreateCheckbox} 0 24u 100% 18u "Keep business data"
  Pop $POSHUB_BUSINESS_CHECK
  ${NSD_SetState} $POSHUB_BUSINESS_CHECK $POSHUB_KEEP_BUSINESS
  ${NSD_OnClick} $POSHUB_BUSINESS_CHECK un.PosnicKeepClick
  ${NSD_CreateLabel} 14u 42u 95% 14u "Sales, stock, customers and pending changes."
  Pop $0
  ${NSD_CreateCheckbox} 0 58u 100% 18u "Keep hardware settings"
  Pop $POSHUB_HARDWARE_CHECK
  ${NSD_SetState} $POSHUB_HARDWARE_CHECK $POSHUB_KEEP_HARDWARE
  ${NSD_OnClick} $POSHUB_HARDWARE_CHECK un.PosnicKeepClick
  ${NSD_CreateLabel} 14u 76u 95% 14u "Scales, printers and kitchen screens."
  Pop $0
  ${NSD_CreateCheckbox} 0 94u 100% 18u "Keep saved backups"
  Pop $POSHUB_BACKUPS_CHECK
  ${NSD_SetState} $POSHUB_BACKUPS_CHECK $POSHUB_KEEP_BACKUPS
  ${NSD_OnClick} $POSHUB_BACKUPS_CHECK un.PosnicKeepClick
  ${NSD_CreateLabel} 0 116u 100% 22u "Cloud data stays unchanged. Unchecked local data is permanently deleted. No extra backup is created."
  Pop $0
  Call un.PosnicSyncRemoveAll
  nsDialogs::Show
FunctionEnd

Function un.PosnicRemoveAllClick
  Pop $0
  ${NSD_GetState} $POSHUB_REMOVE_ALL_CHECK $1
  ${If} $1 == ${BST_CHECKED}
    StrCpy $1 ${BST_UNCHECKED}
  ${Else}
    StrCpy $1 ${BST_CHECKED}
  ${EndIf}
  ${NSD_SetState} $POSHUB_BUSINESS_CHECK $1
  ${NSD_SetState} $POSHUB_HARDWARE_CHECK $1
  ${NSD_SetState} $POSHUB_BACKUPS_CHECK $1
FunctionEnd

Function un.PosnicKeepClick
  Pop $0
  Call un.PosnicSyncRemoveAll
FunctionEnd

Function un.PosnicSyncRemoveAll
  ${NSD_GetState} $POSHUB_BUSINESS_CHECK $1
  ${NSD_GetState} $POSHUB_HARDWARE_CHECK $2
  ${NSD_GetState} $POSHUB_BACKUPS_CHECK $3
  ${If} $1 == ${BST_UNCHECKED}
  ${AndIf} $2 == ${BST_UNCHECKED}
  ${AndIf} $3 == ${BST_UNCHECKED}
    ${NSD_SetState} $POSHUB_REMOVE_ALL_CHECK ${BST_CHECKED}
  ${Else}
    ${NSD_SetState} $POSHUB_REMOVE_ALL_CHECK ${BST_UNCHECKED}
  ${EndIf}
FunctionEnd

Function un.PosnicDataLeave
  ${NSD_GetState} $POSHUB_BUSINESS_CHECK $POSHUB_KEEP_BUSINESS
  ${NSD_GetState} $POSHUB_HARDWARE_CHECK $POSHUB_KEEP_HARDWARE
  ${NSD_GetState} $POSHUB_BACKUPS_CHECK $POSHUB_KEEP_BACKUPS
  StrCpy $POSHUB_REMOVAL_SUMMARY "Cloud data unchanged.$\r$\n"
  ${If} $POSHUB_KEEP_BUSINESS == 1
    StrCpy $POSHUB_REMOVAL_SUMMARY "$POSHUB_REMOVAL_SUMMARY$\r$\nBusiness data: kept"
  ${Else}
    StrCpy $POSHUB_REMOVAL_SUMMARY "$POSHUB_REMOVAL_SUMMARY$\r$\nBusiness data: permanently removed from this computer"
  ${EndIf}
  ${If} $POSHUB_KEEP_HARDWARE == 1
    StrCpy $POSHUB_REMOVAL_SUMMARY "$POSHUB_REMOVAL_SUMMARY$\r$\nHardware settings: kept"
  ${Else}
    StrCpy $POSHUB_REMOVAL_SUMMARY "$POSHUB_REMOVAL_SUMMARY$\r$\nHardware settings: deleted"
  ${EndIf}
  ${If} $POSHUB_KEEP_BACKUPS == 1
    StrCpy $POSHUB_REMOVAL_SUMMARY "$POSHUB_REMOVAL_SUMMARY$\r$\nSaved backups: kept"
  ${Else}
    StrCpy $POSHUB_REMOVAL_SUMMARY "$POSHUB_REMOVAL_SUMMARY$\r$\nSaved backups: deleted"
  ${EndIf}
  ${If} $POSHUB_KEEP_BUSINESS == 1
  ${AndIf} $POSHUB_KEEP_HARDWARE == 1
  ${AndIf} $POSHUB_KEEP_BACKUPS == 1
    Return
  ${EndIf}
  MessageBox MB_YESNO|MB_ICONEXCLAMATION|MB_DEFBUTTON2 "Apply these choices?$\r$\n$POSHUB_REMOVAL_SUMMARY$\r$\n$\r$\nUnchecked local data will be permanently removed. No extra backup will be created. Continue?" /SD IDNO IDYES +2
    Abort
FunctionEnd

Function un.PosnicApplyData
  IfSilent 0 +2
    Return
  ; NSIS is 32-bit. Its default PowerShell cannot inspect a running 64-bit
  ; application's executable path, so use the native host for this check.
  StrCpy $POSHUB_POWERSHELL "$SYSDIR\WindowsPowerShell\v1.0\powershell.exe"
  ${If} ${RunningX64}
    StrCpy $POSHUB_POWERSHELL "$WINDIR\Sysnative\WindowsPowerShell\v1.0\powershell.exe"
  ${EndIf}
  SetDetailsView show
  SetDetailsPrint both
  DetailPrint "Applying your data choices..."
  nsExec::ExecToLog '"$POSHUB_POWERSHELL" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$INSTDIR\resources\setup-data.ps1" -DataRoot "$APPDATA\posnic" -BackupsRoot "$DOCUMENTS\Posnic-Backups" -RecoveryRoot "$DOCUMENTS\Posnic-Recovery" -AppExecutable "$INSTDIR\${APP_EXECUTABLE_FILENAME}" -HardwareManifest "$INSTDIR\resources\setup-hardware-files.json" -KeepBusiness $POSHUB_KEEP_BUSINESS -KeepHardware $POSHUB_KEEP_HARDWARE -KeepBackups $POSHUB_KEEP_BACKUPS'
  Pop $0
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Removal stopped. See the details above for the error. Your selected cleanup may be incomplete." /SD IDOK
    Abort
  ${EndIf}
FunctionEnd
!endif

; Custom uninstallation steps
!macro customUnInstall
  ; Apply choices only when uninstall starts, so Back/Cancel on earlier pages
  ; cannot change data. This hook runs before electron-builder removes files.
  Call un.PosnicApplyData
  DetailPrint "Removing PosHub..."
  DetailPrint "Removing startup launcher..."
  
  ; Remove from Windows startup registry
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "PosHub"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Posnic"
  ReadRegStr $0 HKCU "Software\PosHub" "Start Menu Folder"
  StrCmp $0 "" 0 +3
    ReadRegStr $0 HKCU "Software\Posnic" "Start Menu Folder"
    StrCmp $0 "" 0 +2
      StrCpy $0 "PosHub"
  Delete "$SMPROGRAMS\$0\Open PosHub Backups.lnk"
  Delete "$SMPROGRAMS\$0\Open Posnic Backups.lnk"
  RMDir "$SMPROGRAMS\$0"
  DeleteRegValue HKCU "Software\PosHub" "Start Menu Folder"
  DeleteRegKey /ifempty HKCU "Software\PosHub"
  DeleteRegValue HKCU "Software\Posnic" "Start Menu Folder"
  DeleteRegKey /ifempty HKCU "Software\Posnic"
  
  ; Data choices were applied before application removal.
!macroend

; Shell plugins may change the shell context. Never rely on that context for
; the final registration cleanup of this per-user installation. Keep a live
; installation registered, and do not remove another installation's entry.
!macro POSHUB_VERIFY_REMOVAL
  IfFileExists "$INSTDIR\${APP_EXECUTABLE_FILENAME}" posnic_removal_failed
  ReadRegStr $0 HKCU "${INSTALL_REGISTRY_KEY}" "InstallLocation"
  ${If} $0 != ""
  ${AndIf} $0 != $INSTDIR
    Goto posnic_removal_failed
  ${EndIf}
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}"
  ${If} $0 == "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}"
  ${EndIf}
  DeleteRegKey HKCU "${UNINSTALL_REGISTRY_KEY}"
  DeleteRegKey HKCU "${INSTALL_REGISTRY_KEY}"
  ClearErrors
  EnumRegValue $0 HKCU "${UNINSTALL_REGISTRY_KEY}" 0
  IfErrors 0 posnic_removal_failed
  ClearErrors
  EnumRegValue $0 HKCU "${INSTALL_REGISTRY_KEY}" 0
  IfErrors posnic_removal_verified posnic_removal_failed
  posnic_removal_failed:
    SetErrorLevel 1
    Abort "Removal is incomplete. Close the application and run the installer to repair it, then retry removal."
  posnic_removal_verified:
    DetailPrint "Application removal and Windows registration verified."
!macroend

; Runs after electron-builder's file, shortcut and registration cleanup. A
; failure must not reach the successful finish page.
!macro customUnInstallSection
  Section "un.Verify removal"
    !insertmacro check64BitAndSetRegView
    !insertmacro POSHUB_VERIFY_REMOVAL
  SectionEnd
!macroend
