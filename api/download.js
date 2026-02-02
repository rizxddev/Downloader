// api/download.js - Using external APIs
const axios = require('axios');

module.exports = async (req, res) => {
    // Set CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { url, platform, type, quality } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        let downloadUrl;
        
        if (platform === 'tiktok') {
            // Use TikTok API services
            if (type === 'video') {
                // API 1: tikmate.app
                const response = await axios.get(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`);
                downloadUrl = response.data.video_url || response.data.url;
                
                if (!downloadUrl) {
                    // API 2: tiktokvideodownloader.com
                    const api2 = await axios.post('https://tiktokvideodownloader.com/analysis', {
                        url: url
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    downloadUrl = api2.data.download_url;
                }
            } else if (type === 'audio') {
                // For audio, use different API
                const response = await axios.get(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`);
                downloadUrl = response.data.music_url;
            }
        } else if (platform === 'youtube') {
            // Use y2mate API or similar
            const response = await axios.get(`https://api.y2mate.guru/api/convert`, {
                params: {
                    url: url,
                    format: type === 'audio' ? 'mp3' : 'mp4',
                    quality: quality || '720'
                }
            });
            
            if (response.data.success) {
                downloadUrl = response.data.url;
            }
        }
        
        if (downloadUrl) {
            return res.json({
                success: true,
                downloadUrl: downloadUrl,
                filename: `${platform}_download_${Date.now()}.${type === 'audio' ? 'mp3' : 'mp4'}`
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to get download URL' 
            });
        }
        
    } catch (error) {
        console.error('Download error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
};
