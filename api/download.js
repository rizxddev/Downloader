// api/download.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url, platform, type, quality } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Create temp directory
        const tempDir = path.join('/tmp', 'downloads');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const filename = `${platform}_${type}_${timestamp}_${randomId}`;

        let command = 'yt-dlp --no-check-certificate --no-warnings ';

        // Build command based on platform and type
        if (platform === 'tiktok') {
            command += '--add-header "User-Agent:TikTok" ';
            
            if (type === 'video') {
                if (quality === '720') {
                    command += '-f "best[height<=720]" ';
                } else {
                    command += '-f "best" ';
                }
                command += `--merge-output-format mp4 -o "${tempDir}/${filename}.%(ext)s" `;
            } else if (type === 'audio') {
                command += `-x --audio-format mp3 --audio-quality 0 -o "${tempDir}/${filename}.%(ext)s" `;
            }
        } else if (platform === 'youtube') {
            if (type === 'video') {
                if (quality === '1080') {
                    command += '-f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]" ';
                } else if (quality === '720') {
                    command += '-f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]" ';
                } else if (quality === '480') {
                    command += '-f "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]" ';
                } else {
                    command += '-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]" ';
                }
                command += `--merge-output-format mp4 -o "${tempDir}/${filename}.%(ext)s" `;
            } else if (type === 'audio') {
                command += `-x --audio-format mp3 --audio-quality 0 -o "${tempDir}/${filename}.%(ext)s" `;
            }
        }

        command += `"${url}"`;

        // Execute yt-dlp command
        await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('Download error:', error);
                    console.error('Stderr:', stderr);
                    reject(new Error('Download failed'));
                    return;
                }

                // Find the downloaded file
                fs.readdir(tempDir, (err, files) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const downloadedFile = files.find(f => f.includes(filename));
                    if (!downloadedFile) {
                        reject(new Error('File not found after download'));
                        return;
                    }

                    const filePath = path.join(tempDir, downloadedFile);
                    const fileContent = fs.readFileSync(filePath);

                    // Send file as response
                    res.setHeader('Content-Type', getContentType(downloadedFile));
                    res.setHeader('Content-Disposition', `attachment; filename="${downloadedFile}"`);
                    res.send(fileContent);

                    // Clean up
                    fs.unlinkSync(filePath);
                    resolve();
                });
            });
        });

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
};

function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
        '.m4a': 'audio/mp4'
    };
    return types[ext] || 'application/octet-stream';
}
