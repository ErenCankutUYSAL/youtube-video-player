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
        :: Refresh environment variables
        call refreshenv
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
        :: Refresh environment variables
        call refreshenv
    ) else (
        echo [91mNode.js installation failed[0m
        pause
        exit /b 1
    )
)

:: Enhanced FFmpeg installation and verification
echo [93mChecking FFmpeg installation...[0m

:: First, try to find ffmpeg in PATH
where ffmpeg >nul 2>&1
if %errorLevel% == 0 (
    :: Verify FFmpeg functionality
    ffmpeg -version >nul 2>&1
    if !errorLevel! == 0 (
        echo [92mFFmpeg is already installed and working[0m
        goto FFMPEG_OK
    )
)

:: If not found or not working, install/reinstall
echo [93mInstalling/Reinstalling FFmpeg...[0m

:: Remove existing FFmpeg if any
choco uninstall ffmpeg -y >nul 2>&1

:: Install FFmpeg
choco install ffmpeg -y --force
if !errorLevel! == 0 (
    echo [92mFFmpeg installed successfully[0m
    :: Refresh environment variables
    call refreshenv
    
    :: Verify installation
    where ffmpeg >nul 2>&1
    if !errorLevel! == 0 (
        ffmpeg -version >nul 2>&1
        if !errorLevel! == 0 (
            echo [92mFFmpeg verification successful[0m
            goto FFMPEG_OK
        )
    )
    echo [91mFFmpeg verification failed after installation[0m
    pause
    exit /b 1
) else (
    echo [91mFFmpeg installation failed[0m
    pause
    exit /b 1
)

:FFMPEG_OK

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

:: Verify FFmpeg is in PATH after all installations
where ffmpeg >nul 2>&1
if %errorLevel% == 0 (
    echo [92mFFmpeg is properly set in PATH[0m
) else (
    echo [91mWarning: FFmpeg might not be properly set in PATH[0m
    echo Please restart your computer after installation
)

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

:: Create a test file using FFmpeg to verify it's working
echo [93mVerifying FFmpeg functionality...[0m
ffmpeg -f lavfi -i color=c=black:s=100x100:d=1 -c:v libx264 test_output.mp4
if %errorLevel% == 0 (
    echo [92mFFmpeg test successful[0m
    del test_output.mp4
) else (
    echo [91mFFmpeg test failed. Please restart your computer and try again.[0m
    pause
    exit /b 1
)

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