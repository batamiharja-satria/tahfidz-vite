#!/bin/bash

echo "🔧 Generating missing PWA icons..."

# Pastikan di folder public
cd public

# Convert pwa-512x512.png ke berbagai ukuran yang dibutuhkan
echo "📱 Creating 64x64 icon..."
convert pwa-512x512.png -resize 64x64 pwa-64x64.png

echo "📱 Creating maskable 192x192 icon..."
convert pwa-512x512.png -resize 192x192 -gravity center -background transparent -extent 192x192 pwa-maskable-192x192.png

echo "📱 Creating maskable 512x512 icon..."
convert pwa-512x512.png -gravity center -background transparent -extent 512x512 pwa-maskable-512x512.png

echo "✅ All icons generated successfully!"
echo ""
echo "📁 Files created:"
echo "   - pwa-64x64.png"
echo "   - pwa-maskable-192x192.png" 
echo "   - pwa-maskable-512x512.png"
