#!/bin/bash
# install-yt-dlp.sh

echo "🚀 Installing yt-dlp on Vercel..."

# Install Python and pip
apt-get update && apt-get install -y python3 python3-pip ffmpeg

# Install yt-dlp
pip3 install yt-dlp

# Check installation
yt-dlp --version

echo "✅ yt-dlp installed successfully!"
