@echo off

echo Temporarily adding Node.js to PATH...
set "PATH=%PATH%;C:\Program Files\nodejs"

echo Installing dependencies (if needed)...
"C:\Program Files\nodejs\npm.cmd" install

REM Check if npm install was successful
if %errorlevel% neq 0 (
  echo NPM install failed! Exiting...
  pause
  exit /b %errorlevel%
)

echo Starting Next.js development server on port 3000...
"C:\Program Files\nodejs\node.exe" node_modules\next\dist\bin\next dev -p 3000 