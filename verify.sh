#!/bin/bash
# Verification script to check if all components are properly installed and configured

echo "🔍 Repair System Verification Script"
echo "===================================="
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
  echo "✅ .env.local exists"
  
  # Check required variables
  if grep -q "SUPABASE_URL=" .env.local; then
    echo "  ✅ SUPABASE_URL configured"
  else
    echo "  ❌ SUPABASE_URL not configured"
  fi
  
  if grep -q "ADMIN_USER=" .env.local; then
    echo "  ✅ ADMIN_USER configured"
  else
    echo "  ❌ ADMIN_USER not configured"
  fi
  
  if grep -q "ADMIN_PASS=" .env.local; then
    echo "  ✅ ADMIN_PASS configured"
  else
    echo "  ❌ ADMIN_PASS not configured"
  fi
else
  echo "❌ .env.local not found"
  echo "   Please create it from .env.example: cp .env.example .env.local"
fi

echo ""
echo "📁 Directory Structure Check"
echo "============================"

# Check key directories
directories=(
  "src/app"
  "src/components"
  "src/utils"
  "src/hooks"
  "src/types"
  "src/app/api"
  "public"
)

for dir in "${directories[@]}"; do
  if [ -d "$dir" ]; then
    echo "✅ $dir"
  else
    echo "❌ $dir (missing)"
  fi
done

echo ""
echo "📄 Key Files Check"
echo "=================="

files=(
  "package.json"
  "next.config.ts"
  "tsconfig.json"
  ".env.example"
  "README_NEW.md"
  "FEATURES.md"
  "src/config.ts"
  "src/types/index.ts"
  "src/utils/errorHandler.ts"
  "src/utils/logger.ts"
  "src/utils/dateFormat.ts"
  "src/hooks/useSession.ts"
  "src/components/ErrorBoundary.tsx"
  "src/app/api/submit/route.ts"
  "src/app/api/reports/route.ts"
  "src/app/api/export/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (missing)"
  fi
done

echo ""
echo "🔧 Node Modules Check"
echo "====================="

if [ -d "node_modules" ]; then
  echo "✅ node_modules exists"
  
  # Check key dependencies
  deps=("next" "react" "@supabase/supabase-js")
  for dep in "${deps[@]}"; do
    if [ -d "node_modules/$dep" ]; then
      echo "  ✅ $dep installed"
    else
      echo "  ❌ $dep not installed"
    fi
  done
else
  echo "❌ node_modules not found"
  echo "   Please run: npm install"
fi

echo ""
echo "✨ Setup Steps (if needed)"
echo "========================="
echo ""
echo "1. Install dependencies:"
echo "   npm install"
echo ""
echo "2. Create .env.local:"
echo "   cp .env.example .env.local"
echo ""
echo "3. Configure environment variables:"
echo "   - SUPABASE_URL and keys"
echo "   - LINE_CHANNEL_ACCESS_TOKEN (optional)"
echo "   - ADMIN_USER and ADMIN_PASS"
echo ""
echo "4. Start development server:"
echo "   npm run dev"
echo ""
echo "5. Build for production:"
echo "   npm run build"
echo "   npm start"
echo ""
echo "📚 Documentation Files"
echo "===================="
echo "- README_NEW.md: Setup and usage guide"
echo "- FEATURES.md: Complete features and improvements"
echo ".env.example: All required environment variables"
echo ""
