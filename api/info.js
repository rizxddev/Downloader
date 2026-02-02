// api/info.js
const { exec } = require('child_process');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Get video info using yt-dlp
        const info = await new Promise((resolve, reject) => {
            const command = `yt-dlp --no-check-certificate --dump-json "${url}"`;
            
            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Info error:', error);
                    console.error('Stderr:', stderr);
                    reject(new Error('Failed to get video info'));
                    return;
                }

                try {
                    const data = JSON.parse(stdout);
                    resolve({
                        success: true,
                        url: url,
                        title: data.title || 'Unknown',
                        author: data.uploader || 'Unknown',
                        duration: data.duration || 0,
                        views: data.view_count || 0,
                        thumbnail: data.thumbnail || null
                    });
                } catch (parseError) {
                    reject(new Error('Failed to parse video info'));
                }
            });
        });

        res.status(200).json(info);

    } catch (error) {
        console.error('Info API error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to get video information' 
        });
    }
};
