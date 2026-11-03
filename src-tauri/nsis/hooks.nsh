!macro NSIS_HOOK_PREUNINSTALL
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to completely delete all local library data, playback history, and bookmarks?$\n$\nSelect 'No' if you want to keep your data for future reinstallation." IDNO skip_delete
    RMDir /r "$APPDATA\com.auraaudio.desktop"
    RMDir /r "$LOCALAPPDATA\com.auraaudio.desktop"
  skip_delete:
!macroend

