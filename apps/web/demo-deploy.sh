#!/bin/bash

echo "🚀 Quick Demo Deployment Script"
echo "================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "Please create .env.local with your environment variables:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "GROQ_API_KEY=your_groq_api_key"
    echo ""
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "Choose deployment method:"
echo "1) Vercel (Recommended - Fastest)"
echo "2) Local preview with ngrok"
echo "3) Production build preview"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "📤 Deploying to Vercel..."
        npx vercel --prod
        ;;
    2)
        echo "🔧 Starting local server with ngrok..."
        npm run dev &
        sleep 5
        npx ngrok http 3000
        ;;
    3)
        echo "🖥️  Starting production preview..."
        npm run start
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac