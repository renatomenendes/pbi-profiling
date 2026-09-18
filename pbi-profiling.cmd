@echo off
setlocal

set "PBI_PROFILING_ROOT=%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo pbi-profiling requires Node.js 20 or newer.
  echo Install an approved Node.js runtime and try again.
  exit /b 1
)

for /f "usebackq delims=" %%V in (`node -p "Number(process.versions.node.split('.')[0])"`) do set "NODE_MAJOR=%%V"

if not defined NODE_MAJOR (
  echo Could not determine the installed Node.js version.
  exit /b 1
)

if %NODE_MAJOR% LSS 20 (
  echo pbi-profiling requires Node.js 20 or newer. Detected major version %NODE_MAJOR%.
  exit /b 1
)

node "%PBI_PROFILING_ROOT%src\app.js"
set "EXIT_CODE=%ERRORLEVEL%"

endlocal & exit /b %EXIT_CODE%
