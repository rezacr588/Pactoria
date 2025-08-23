#!/bin/bash

# Add environment variables to Vercel
echo "Adding environment variables to Vercel..."

echo "https://efqljjmausicfkhjhhtl.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmcWxqam1hdXNpY2ZraGpoaHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzgwMzIsImV4cCI6MjA3MTIxNDAzMn0.YgOQZI3LfkBv92grUt6ssao6yfdr1-mnh_xS1bkRTRo" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "postgresql://postgres:Ww!97905199@db.efqljjmausicfkhjhhtl.supabase.co:5432/postgres" | npx vercel env add DATABASE_URL production
echo "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" | npx vercel env add GROQ_API_KEY production

echo "Environment variables added successfully!"