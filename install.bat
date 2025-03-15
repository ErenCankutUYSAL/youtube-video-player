@echo off
setlocal enabledelayedexpansion

:: Change to the script's directory
cd /d "%~dp0"

echo [92mYouTube Video Player Installation Script[0m
echo ======================================

:: Check for administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [92mAdministrator privileges verified[0m
) else (
    echo [91mThis script requires administrator privileges[0m
    echo Please run this script as administrator
    pause
    exit /b 1
)

:: Check and install Chocolatey
where choco >nul 2>&1
if %errorLevel% == 1 (
    echo [93mInstalling Chocolatey...[0m
    @powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"
    if !errorLevel! == 0 (
        echo [92mChocolatey installed successfully[0m
        refreshenv
    ) else (
        echo [91mChocolatey installation failed[0m
        pause
        exit /b 1
    )
)

:: Check and install Node.js
where node >nul 2>&1
if %errorLevel% == 1 (
    echo [93mInstalling Node.js...[0m
    choco install nodejs -y
    if !errorLevel! == 0 (
        echo [92mNode.js installed successfully[0m
        refreshenv
    ) else (
        echo [91mNode.js installation failed[0m
        pause
        exit /b 1
    )
)

:: Check and install FFmpeg
where ffmpeg >nul 2>&1
if %errorLevel% == 1 (
    echo [93mInstalling FFmpeg...[0m
    choco install ffmpeg -y
    if !errorLevel! == 0 (
        echo [92mFFmpeg installed successfully[0m
    ) else (
        echo [91mFFmpeg installation failed[0m
        pause
        exit /b 1
    )
)

:: Check Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [92mNode.js version: %NODE_VERSION%[0m

:: Check package.json
if not exist "package.json" (
    echo [91mError: package.json not found![0m
    echo Please run this script in the project root directory.
    pause
    exit /b 1
)

:: Install npm packages
echo [93mInstalling npm packages...[0m
call npm install --no-audit
if %errorLevel% == 0 (
    echo [92mnpm packages installed successfully[0m
) else (
    echo [91mnpm packages installation failed[0m
    echo Check npm-debug.log for error details
    pause
    exit /b 1
)

:: Create recordings directory
if not exist "recordings" mkdir recordings

echo [92mInstallation completed successfully![0m
echo ======================================

:: Ask user if they want to start the application
echo Would you like to start the application now? (Y/N)
choice /c YN /n
if errorlevel 2 goto END
if errorlevel 1 goto STARTAPP

:STARTAPP
:: Start the server and React app
echo [93mStarting the application...[0m

:: Start the server in a new window
start "YouTube Video Player Server" cmd /c "echo [93mStarting server...[0m && npm run server"

:: Wait for the server to start
echo [93mWaiting for server to initialize (5 seconds)...[0m
timeout /t 5 /nobreak > nul

:: Start the React app in a new window
start "YouTube Video Player Client" cmd /c "echo [93mStarting React app...[0m && npm start"

echo [92mApplication started successfully![0m
echo Server window and React app window should now be open
echo You can close this window if everything is running correctly

:END
pause