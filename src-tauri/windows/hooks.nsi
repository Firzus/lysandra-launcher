; Hooks NSIS simplifiés pour HuzStudio
; Les options par défaut de Tauri gèrent déjà l'UI, raccourcis, etc.

!macro customInit
  ; Vérification des privilèges administrateur
  UserInfo::GetAccountType
  pop $0
  ${If} $0 != "admin"
    MessageBox MB_ICONSTOP "HuzStudio nécessite des privilèges administrateur pour l'installation.$\nVeuillez relancer l'installeur en tant qu'administrateur."
    SetErrorLevel 740 ; ERROR_ELEVATION_REQUIRED
    Quit
  ${EndIf}
!macroend

!macro customInstall
  ; Installation terminée avec succès
  DetailPrint "Installation HuzStudio terminée avec succès !"
!macroend

!macro customUnInit
  ; Vérification des privilèges pour la désinstallation
  UserInfo::GetAccountType
  pop $0
  ${If} $0 != "admin"
    MessageBox MB_ICONEXCLAMATION "La désinstallation nécessite des privilèges administrateur.$\nVeuillez relancer en tant qu'administrateur."
    SetErrorLevel 740
    Quit
  ${EndIf}
!macroend 