#!/bin/bash

# Graph Book Reader - Setup Verification Script
# This script verifies that all necessary files are in place

echo "📖 Graph Book Reader - Setup Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

checks_passed=0
checks_total=0

check_file() {
    checks_total=$((checks_total + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        checks_passed=$((checks_passed + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $2 (missing: $1)"
        return 1
    fi
}

check_dir() {
    checks_total=$((checks_total + 1))
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        checks_passed=$((checks_passed + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $2 (missing: $1)"
        return 1
    fi
}

echo "Checking core files..."
check_file "docker-compose.yml" "Docker Compose config"
check_file "Dockerfile" "Dockerfile"
check_file "package.json" "Package dependencies"
check_file "vite.config.js" "Vite configuration"
check_file "tailwind.config.js" "Tailwind CSS config"
check_file "index.html" "HTML entry point"

echo ""
echo "Checking source code..."
check_file "src/main.jsx" "React entry point"
check_file "src/App.jsx" "Main App component"
check_file "src/index.css" "Global styles"
check_file "src/components/ChapterReader.jsx" "Chapter reader component"
check_file "src/components/GraphVisualization.jsx" "Graph visualization component"
check_file "src/data/graphData.js" "Character relationship data"

echo ""
echo "Checking documentation..."
check_file "README.md" "Project README"
check_file "USAGE.md" "Usage guide"
check_file "PROJECT_SUMMARY.md" "Project summary"

echo ""
echo "Checking assets..."
check_file "public/后宫·甄嬛传（修订典藏版）-流潋紫.epub" "EPUB book file"

echo ""
echo "Checking directories..."
check_dir "src" "Source directory"
check_dir "src/components" "Components directory"
check_dir "src/data" "Data directory"
check_dir "public" "Public assets directory"

echo ""
echo "=========================================="
echo -e "Result: ${GREEN}${checks_passed}${NC} / ${checks_total} checks passed"
echo ""

if [ $checks_passed -eq $checks_total ]; then
    echo -e "${GREEN}✓ All files present! Project is ready.${NC}"
    echo ""
    echo "To start the project:"
    echo "  1. Docker: docker-compose up"
    echo "  2. Local: npm install && npm run dev"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some files are missing. Please check the output above.${NC}"
    echo ""
    exit 1
fi
