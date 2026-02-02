// api/info.js
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
        const { url, platform } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        let videoInfo = {};
        
        if (platform === 'tiktok') {
            // Use TikTok API to get info
            try {
                const response = await axios.get(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
                videoInfo = {
                    title: response.data.title || 'TikTok Video',
                    author: response.data.author_name || 'Unknown',
                    thumbnail: response.data.thumbnail_url
                };
            } catch (error) {
                // Fallback
                videoInfo = {
                    title: 'TikTok Video',
                    author: 'TikTok User',
                    thumbnail: null
                };
            }
        } else if (platform === 'youtube') {
            // Use YouTube oEmbed
            try {
                const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
                videoInfo = {
                    title: response.data.title || 'YouTube Video',
                    author: response.data.author_name || 'Unknown',
                    thumbnail: response.data.thumbnail_url
                };
            } catch (error) {
                videoInfo = {
                    title: 'YouTube Video',
                    author: 'YouTube Creator',
                    thumbnail: null
                };
            }
        }
        
        return res.json({
            success: true,
            url: url,
            platform: platform,
            ...videoInfo,
            duration: 0, // API doesn't provide this
            views: 0
        });
        
    } catch (error) {
        console.error('Info error:', error);
        return res.json({
            success: true,
            url: req.body.url,
            platform: req.body.platform,
            title: 'Video',
            author: 'User',
            thumbnail: null,
            duration: 0,
            views: 0
        });
    }
};
