@echo off
setlocal enabledelayedexpansion

echo [92mYouTube Video Player Kurulum Scripti[0m
echo ======================================

:: Administrator yetkisi kontrolü
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [92mAdministrator yetkileri mevcut[0m
) else (
    echo [91mBu script administrator yetkisi gerektirmektedir[0m
    echo Lütfen scripti administrator olarak çalıştırın
    pause
    exit /b 1
)

:: Chocolatey kontrolü ve kurulumu
where choco >nul 2>&1
if %errorLevel% == 1 (
    echo [93mChocolatey kuruluyor...[0m
    @powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"
    if !errorLevel! == 0 (
        echo [92mChocolatey başarıyla kuruldu[0m
    ) else (
        echo [91mChocolatey kurulumu başarısız[0m
        pause
        exit /b 1
    )
)

:: Node.js kontrolü ve kurulumu
where node >nul 2>&1
if %errorLevel% == 1 (
    echo [93mNode.js kuruluyor...[0m
    choco install nodejs -y
    if !errorLevel! == 0 (
        echo [92mNode.js başarıyla kuruldu[0m
    ) else (
        echo [91mNode.js kurulumu başarısız[0m
        pause
        exit /b 1
    )
)

:: FFmpeg kontrolü ve kurulumu
where ffmpeg >nul 2>&1
if %errorLevel% == 1 (
    echo [93mFFmpeg kuruluyor...[0m
    choco install ffmpeg -y
    if !errorLevel! == 0 (
        echo [92mFFmpeg başarıyla kuruldu[0m
    ) else (
        echo [91mFFmpeg kurulumu başarısız[0m
        pause
        exit /b 1
    )
)

:: Node.js sürüm kontrolü
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [92mNode.js sürümü: %NODE_VERSION%[0m

:: npm paketlerinin kurulumu
echo [93mnpm paketleri kuruluyor...[0m
call npm install
if %errorLevel% == 0 (
    echo [92mnpm paketleri başarıyla kuruldu[0m
) else (
    echo [91mnpm paketleri kurulumu başarısız[0m
    pause
    exit /b 1
)

:: Recordings klasörü oluşturma
if not exist "recordings" mkdir recordings

echo [92mKurulum tamamlandı![0m
echo ======================================
echo Kullanım:
echo 1. Sunucuyu başlatmak için: [93mnpm run server[0m
echo 2. React uygulamasını başlatmak için: [93mnpm start[0m
echo 3. Kayıtlar 'recordings' klasöründe saklanacaktır

pause