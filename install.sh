#!/bin/bash

# Renk tanımlamaları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}YouTube Video Player Kurulum Scripti${NC}"
echo "======================================"

# İşletim sistemi kontrolü
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${YELLOW}Linux işletim sistemi tespit edildi${NC}"
    
    # Package manager kontrolü
    if command -v apt-get &> /dev/null; then
        echo "Debian/Ubuntu tabanlı sistem tespit edildi"
        PKG_MANAGER="apt-get"
        PKG_UPDATE="apt-get update"
        INSTALL_CMD="apt-get install -y"
    elif command -v yum &> /dev/null; then
        echo "Red Hat/CentOS tabanlı sistem tespit edildi"
        PKG_MANAGER="yum"
        PKG_UPDATE="yum update"
        INSTALL_CMD="yum install -y"
    else
        echo -e "${RED}Desteklenmeyen Linux dağıtımı${NC}"
        exit 1
    fi

    # Root kontrolü
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}Bu script root yetkisi gerektirmektedir${NC}"
        echo "Lütfen 'sudo' ile çalıştırın"
        exit 1
    fi

    # Sistem güncellemesi
    echo -e "${YELLOW}Sistem güncelleniyor...${NC}"
    $PKG_UPDATE

    # Gerekli paketlerin kurulumu
    echo -e "${YELLOW}Gerekli paketler kuruluyor...${NC}"
    $INSTALL_CMD curl
    $INSTALL_CMD ffmpeg
    
    # Node.js kurulumu
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}Node.js kuruluyor...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        $INSTALL_CMD nodejs
    fi

elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}macOS işletim sistemi tespit edildi${NC}"
    
    # Homebrew kontrolü
    if ! command -v brew &> /dev/null; then
        echo -e "${YELLOW}Homebrew kuruluyor...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi

    # Gerekli paketlerin kurulumu
    echo -e "${YELLOW}Gerekli paketler kuruluyor...${NC}"
    brew install ffmpeg
    brew install node

else
    echo -e "${RED}Desteklenmeyen işletim sistemi${NC}"
    exit 1
fi

# Node.js sürüm kontrolü
NODE_VERSION=$(node -v)
echo -e "${GREEN}Node.js sürümü: $NODE_VERSION${NC}"

# npm paketlerinin kurulumu
echo -e "${YELLOW}npm paketleri kuruluyor...${NC}"
npm install

# Recordings klasörü oluşturma
mkdir -p recordings

echo -e "${GREEN}Kurulum tamamlandı!${NC}"
echo "======================================"
echo -e "Kullanım:"
echo -e "1. Sunucuyu başlatmak için: ${YELLOW}npm run server${NC}"
echo -e "2. React uygulamasını başlatmak için: ${YELLOW}npm start${NC}"
echo -e "3. Kayıtlar 'recordings' klasöründe saklanacaktır"