#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}YouTube Video Player Installation Script${NC}"
echo "======================================"

# OS detection
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${YELLOW}Linux operating system detected${NC}"
    
    # Package manager detection
    if command -v apt-get &> /dev/null; then
        echo "Debian/Ubuntu-based system detected"
        PKG_MANAGER="apt-get"
        PKG_UPDATE="apt-get update"
        INSTALL_CMD="apt-get install -y"
    elif command -v yum &> /dev/null; then
        echo "Red Hat/CentOS-based system detected"
        PKG_MANAGER="yum"
        PKG_UPDATE="yum update"
        INSTALL_CMD="yum install -y"
    else
        echo -e "${RED}Unsupported Linux distribution${NC}"
        exit 1
    fi

    # Root check
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}This script requires root privileges${NC}"
        echo "Please run with 'sudo'"
        exit 1
    fi

    # System update
    echo -e "${YELLOW}Updating system...${NC}"
    $PKG_UPDATE

    # Install required packages
    echo -e "${YELLOW}Installing required packages...${NC}"
    $INSTALL_CMD curl
    $INSTALL_CMD ffmpeg
    
    # Node.js installation
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}Installing Node.js...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        $INSTALL_CMD nodejs
    fi

elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}macOS operating system detected${NC}"
    
    # Homebrew check
    if ! command -v brew &> /dev/null; then
        echo -e "${YELLOW}Installing Homebrew...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi

    # Install required packages
    echo -e "${YELLOW}Installing required packages...${NC}"
    brew install ffmpeg
    brew install node

else
    echo -e "${RED}Unsupported operating system${NC}"
    exit 1
fi

# Node.js version check
NODE_VERSION=$(node -v)
echo -e "${GREEN}Node.js version: $NODE_VERSION${NC}"

# Check package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found!${NC}"
    echo "Please run this script in the project root directory."
    exit 1
fi

# Install npm packages
echo -e "${YELLOW}Installing npm packages...${NC}"
npm install --no-audit
if [ $? -eq 0 ]; then
    echo -e "${GREEN}npm packages installed successfully${NC}"
else
    echo -e "${RED}npm packages installation failed${NC}"
    echo "Check npm-debug.log for error details"
    exit 1
fi

# Create recordings directory
mkdir -p recordings

echo -e "${GREEN}Installation completed successfully!${NC}"
echo "======================================"

# Ask to start the application
read -p "Would you like to start the application now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Starting the application...${NC}"
    
    # Start the server in a new terminal window
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e 'tell app "Terminal" to do script "cd \"'$PWD'\" && echo \"Starting server...\" && npm run server"'
    else
        # Linux
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd '$PWD' && echo 'Starting server...' && npm run server"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd '$PWD' && echo 'Starting server...' && npm run server" &
        else
            echo -e "${RED}No suitable terminal emulator found${NC}"
            exit 1
        fi
    fi
    
    # Wait for server to start
    echo -e "${YELLOW}Waiting for server to initialize (5 seconds)...${NC}"
    sleep 5
    
    # Start the React app in a new terminal window
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e 'tell app "Terminal" to do script "cd \"'$PWD'\" && echo \"Starting React app...\" && npm start"'
    else
        # Linux
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd '$PWD' && echo 'Starting React app...' && npm start"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd '$PWD' && echo 'Starting React app...' && npm start" &
        fi
    fi
    
    echo -e "${GREEN}Application started successfully!${NC}"
    echo "Server window and React app window should now be open"
    echo "You can close this window if everything is running correctly"
fi