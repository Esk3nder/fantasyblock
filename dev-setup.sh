#!/bin/bash

# FantasyBlock Local Development Setup Script
echo "<È Setting up FantasyBlock for local development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}L Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}L Node.js version 18+ is required. Current version: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN} Node.js $(node --version) detected${NC}"

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}   PostgreSQL CLI not found. You'll need a PostgreSQL database for FantasyBlock.${NC}"
    echo -e "${BLUE}=¡ You can use a local PostgreSQL, Docker, or cloud service like Supabase/Neon${NC}"
fi

# Install dependencies
echo -e "${BLUE}=æ Installing dependencies...${NC}"
npm install

# Copy environment variables if .env.local doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}=Ë Creating .env.local from template...${NC}"
    cp .env.example .env.local
    echo -e "${YELLOW}   Please edit .env.local and add your actual values before running the app${NC}"
    echo -e "${BLUE}=¡ Required: DATABASE_URL, BETTER_AUTH_SECRET, AUTUMN_SECRET_KEY${NC}"
else
    echo -e "${GREEN} .env.local already exists${NC}"
fi

# Generate Better Auth secret if needed
if ! grep -q "BETTER_AUTH_SECRET=\".*[^-].*\"" .env.local 2>/dev/null; then
    echo -e "${BLUE}= Generating Better Auth secret...${NC}"
    SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/BETTER_AUTH_SECRET=\".*\"/BETTER_AUTH_SECRET=\"$SECRET\"/" .env.local
    else
        sed -i "s/BETTER_AUTH_SECRET=\".*\"/BETTER_AUTH_SECRET=\"$SECRET\"/" .env.local
    fi
    echo -e "${GREEN} Better Auth secret generated${NC}"
fi

echo ""
echo -e "${GREEN}<‰ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. ${YELLOW}Set up your PostgreSQL database${NC}"
echo -e "2. ${YELLOW}Update DATABASE_URL in .env.local${NC}"
echo -e "3. ${YELLOW}Add AUTUMN_SECRET_KEY in .env.local${NC}"
echo -e "4. ${YELLOW}Run database migrations: npm run db:push${NC}"
echo -e "5. ${YELLOW}Start development server: npm run dev${NC}"
echo ""
echo -e "${BLUE}=€ Your FantasyBlock app will be available at http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}=Ú Additional commands:${NC}"
echo -e "  " ${GREEN}npm run dev${NC}        - Start development server"
echo -e "  " ${GREEN}npm run build${NC}      - Build for production"
echo -e "  " ${GREEN}npm run db:studio${NC}  - Open database studio"
echo -e "  " ${GREEN}npm run db:push${NC}    - Push schema changes"
echo ""