; Hooks personnalisés pour l'installation HuzStudio

!macro NSIS_HOOK_PREINSTALL
  ; Message de pré-installation
  DetailPrint "Préparation de l'installation HuzStudio..."
  
  ; Créer le répertoire HuzStudio s'il n'existe pas
  CreateDirectory "$INSTDIR"
  CreateDirectory "$INSTDIR\games"
  CreateDirectory "$INSTDIR\config"
  CreateDirectory "$INSTDIR\cache"
  CreateDirectory "$INSTDIR\logs"
  
  DetailPrint "Structure de répertoires créée dans : $INSTDIR"
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; Message de post-installation
  DetailPrint "Installation HuzStudio terminée avec succès !"
  
  ; Créer un fichier de version pour identifier l'installation
  FileOpen $0 "$INSTDIR\.huzstudio_version" w
  FileWrite $0 "${VERSION}"
  FileClose $0
  
  ; Demander à l'utilisateur s'il veut un raccourci sur le bureau
  MessageBox MB_YESNO|MB_ICONQUESTION "Voulez-vous créer un raccourci HuzStudio sur le bureau ?" IDNO skip_desktop_shortcut
  CreateShortCut "$DESKTOP\HuzStudio.lnk" "$INSTDIR\HuzStudio.exe" "" "$INSTDIR\HuzStudio.exe" 0
  DetailPrint "Raccourci bureau créé"
  
  skip_desktop_shortcut:
  
  ; Créer un raccourci dans le menu Démarrer
  CreateDirectory "$SMPROGRAMS\HuzStudio"
  CreateShortCut "$SMPROGRAMS\HuzStudio\HuzStudio.lnk" "$INSTDIR\HuzStudio.exe" "" "$INSTDIR\HuzStudio.exe" 0
  CreateShortCut "$SMPROGRAMS\HuzStudio\Désinstaller HuzStudio.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
  
  DetailPrint "Raccourcis menu Démarrer créés avec succès"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; Message de pré-désinstallation
  DetailPrint "Préparation de la désinstallation HuzStudio..."
  
  ; Demander à l'utilisateur s'il veut conserver les données des jeux
  MessageBox MB_YESNO|MB_ICONQUESTION "Voulez-vous conserver les données des jeux (sauvegardes, configurations) ?$\n$\nSi vous choisissez 'Non', toutes les données seront supprimées définitivement." IDYES keep_data
  
  ; L'utilisateur veut tout supprimer
  DetailPrint "Suppression de toutes les données utilisateur..."
  RMDir /r "$INSTDIR\games"
  RMDir /r "$INSTDIR\config"
  RMDir /r "$INSTDIR\cache"
  RMDir /r "$INSTDIR\logs"
  Goto end_preuninstall
  
  keep_data:
  DetailPrint "Conservation des données utilisateur..."
  ; Ne supprimer que le cache et les logs temporaires
  RMDir /r "$INSTDIR\cache"
  RMDir /r "$INSTDIR\logs"
  
  end_preuninstall:
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; Supprimer les raccourcis (seulement s'ils existent)
  IfFileExists "$DESKTOP\HuzStudio.lnk" 0 +2
  Delete "$DESKTOP\HuzStudio.lnk"
  
  RMDir /r "$SMPROGRAMS\HuzStudio"
  
  ; Supprimer le fichier de version
  Delete "$INSTDIR\.huzstudio_version"
  
  ; Message de fin de désinstallation
  DetailPrint "Désinstallation HuzStudio terminée."
  
  ; Vérifier s'il reste des fichiers dans le répertoire
  IfFileExists "$INSTDIR\games\*.*" 0 +2
  MessageBox MB_OK "Les données des jeux ont été conservées dans : $INSTDIR"
!macroend 