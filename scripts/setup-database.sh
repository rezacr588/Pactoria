#!/bin/bash

echo "🚀 Setting up Pactoria database..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it with your Supabase credentials."
    exit 1
fi

# Install Supabase CLI if not already installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "📄 Running database migrations..."

# Push all migrations to the database
npx supabase db push --password "Ww!97905199"

if [ $? -eq 0 ]; then
    echo "✅ Database setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Add your Stripe API keys to .env.local"
    echo "2. Create products and prices in Stripe Dashboard"
    echo "3. Configure webhook endpoint in Stripe (pointing to /api/stripe/webhook)"
    echo "4. Add your Groq API key to .env.local"
    echo "5. Run 'npm run dev' to start the application"
else
    echo "❌ Database setup failed. Please check the error messages above."
    exit 1
fi
