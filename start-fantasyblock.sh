#!/bin/bash

# 🏈 FantasyBlock One-Command Setup & Start
# This script does EVERYTHING needed to run FantasyBlock locally

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Fancy header
echo -e "${PURPLE}"
echo "  ______            _                 ____  _            _    "
echo " |  ____|          | |               |  _ \| |          | |   "
echo " | |__ __ _ _ __    | |_ __ _ ___ _   _| |_) | | ___   ___| | __ "
echo " |  __/ _\` | '_ \   | __/ _\` / __| | | |  _ <| |/ _ \ / __| |/ / "
echo " | | | (_| | | | |  | || (_| \__ \ |_| | |_) | | (_) | (__|   <  "
echo " |_|  \__,_|_| |_|   \__\__,_|___/\__, |____/|_|\___/ \___|_|\_\\"
echo "                                   __/ |                       "
echo "                                  |___/                        "
echo -e "${NC}"
echo -e "${BLUE}🚀 AI-Powered Fantasy Draft Assistant${NC}"
echo -e "${BLUE}Starting complete setup and launch...${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is running on a port
port_is_free() {
    ! lsof -i :$1 >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    echo -e "${YELLOW}💡 Download from: https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Current: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check if port 3000 is free
if ! port_is_free 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is in use. Attempting to free it...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
    if ! port_is_free 3000; then
        echo -e "${RED}❌ Cannot free port 3000. Please stop any services running on port 3000.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Port 3000 is available${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install --silent

# Setup environment
echo -e "${BLUE}🔧 Setting up environment...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}📋 Creating .env.local from template...${NC}"
    cp .env.example .env.local
    
    # Generate Better Auth secret
    echo -e "${BLUE}🔐 Generating Better Auth secret...${NC}"
    SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/BETTER_AUTH_SECRET=\".*\"/BETTER_AUTH_SECRET=\"$SECRET\"/" .env.local
    else
        sed -i "s/BETTER_AUTH_SECRET=\".*\"/BETTER_AUTH_SECRET=\"$SECRET\"/" .env.local
    fi
    echo -e "${GREEN}✅ Better Auth secret generated${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

# Check for DATABASE_URL
if ! grep -q "DATABASE_URL=\"postgresql://" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not configured!${NC}"
    echo -e "${BLUE}💡 For quick testing, you can use a temporary local database:${NC}"
    echo ""
    
    # Offer to set up a quick database URL for testing
    read -p "$(echo -e ${YELLOW}Would you like to use a demo database URL for testing? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Use a demo/placeholder URL that shows the app without DB functionality
        DEMO_URL="postgresql://demo:demo@localhost:5432/fantasyblock_demo"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|DATABASE_URL=\".*\"|DATABASE_URL=\"$DEMO_URL\"|" .env.local
        else
            sed -i "s|DATABASE_URL=\".*\"|DATABASE_URL=\"$DEMO_URL\"|" .env.local
        fi
        echo -e "${YELLOW}⚠️  Using demo database URL. Some features may not work without a real database.${NC}"
    else
        echo -e "${YELLOW}⚠️  Please edit .env.local and add your PostgreSQL DATABASE_URL before running again.${NC}"
        echo -e "${BLUE}💡 You can use services like Supabase, Neon, or local PostgreSQL.${NC}"
        exit 1
    fi
fi

# Check for AUTUMN_SECRET_KEY
if ! grep -q "AUTUMN_SECRET_KEY=\".*[^-].*\"" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠️  AUTUMN_SECRET_KEY not configured. Using demo key...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/AUTUMN_SECRET_KEY=\".*\"/AUTUMN_SECRET_KEY=\"demo_key_for_testing\"/" .env.local
    else
        sed -i "s/AUTUMN_SECRET_KEY=\".*\"/AUTUMN_SECRET_KEY=\"demo_key_for_testing\"/" .env.local
    fi
fi

# Validate environment
echo -e "${BLUE}🧪 Validating environment...${NC}"
if npm run test:env --silent 2>/dev/null; then
    echo -e "${GREEN}✅ Environment validated${NC}"
else
    echo -e "${YELLOW}⚠️  Environment validation warnings (continuing anyway)${NC}"
fi

# Try to set up database (if possible)
echo -e "${BLUE}🗄️  Setting up database...${NC}"
if npm run db:push --silent 2>/dev/null; then
    echo -e "${GREEN}✅ Database schema ready${NC}"
    
    # Seed with sample data
    echo -e "${BLUE}🌱 Adding sample fantasy data...${NC}"
    if npm run db:seed --silent 2>/dev/null; then
        echo -e "${GREEN}✅ Sample data loaded (NFL, NBA, MLB players)${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not seed database (continuing anyway)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Database setup skipped (app will run without database features)${NC}"
fi

# Final validation
echo -e "${BLUE}🔍 Running final validation...${NC}"
if npm run validate --silent 2>/dev/null; then
    echo -e "${GREEN}✅ All systems ready${NC}"
else
    echo -e "${YELLOW}⚠️  Some validations failed (app will still start)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 FantasyBlock setup complete!${NC}"
echo ""
echo -e "${PURPLE}🏈 Starting FantasyBlock development server...${NC}"
echo ""
echo -e "${BLUE}📍 Your app will be available at: ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}🎯 What you can test:${NC}"
echo -e "   • Homepage with sport selection (NFL, NBA, MLB)"
echo -e "   • Draft setup flow with league configuration"
echo -e "   • Live draft room with AI recommendations"
echo -e "   • League management and preferences"
echo -e "   • User registration and authentication"
echo ""
echo -e "${BLUE}💡 Press Ctrl+C to stop the server${NC}"
echo ""

# Start the development server
npm run dev