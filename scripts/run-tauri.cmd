@echo off
setlocal
SET "PATH=%USERPROFILE%\.cargo\bin;C:\nvm4w\nodejs;%PATH%"
call "%~dp0..\node_modules\.bin\tauri.cmd" %*
exit /b %ERRORLEVEL%
