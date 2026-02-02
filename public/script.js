// script.js
const API_BASE = '/api';

let currentPlatform = 'tiktok';
let currentVideoInfo = null;

// Platform selection
document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPlatform = btn.dataset.platform;
        resetForm();
    });
});

// Analyze button
document.getElementById('analyzeBtn').addEventListener('click', analyzeURL);

// URL input Enter key
document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeURL();
});

async function analyzeURL() {
    const url = document.getElementById('urlInput').value.trim();
    
    if (!url) {
        showError('Please enter a URL');
        return;
    }
    
    // Validate URL
    if (currentPlatform === 'tiktok' && !url.includes('tiktok.com')) {
        showError('Please enter a valid TikTok URL');
        return;
    }
    
    if (currentPlatform === 'youtube' && !(url.includes('youtube.com') || url.includes('youtu.be'))) {
        showError('Please enter a valid YouTube URL');
        return;
    }
    
    showLoading();
    
    try {
        // Get video info from API
        const response = await fetch(`${API_BASE}/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                platform: currentPlatform
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentVideoInfo = data;
            showVideoInfo(data);
            showDownloadOptions(data);
        } else {
            showError(data.error || 'Failed to analyze video');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error(error);
    } finally {
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('videoInfoSection').style.display = 'none';
    document.getElementById('downloadOptions').style.display = 'none';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    
    // Simulate progress
    let progress = 0;
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');
    
    const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = `${progress}%`;
        
        if (progress <= 30) {
            statusText.textContent = 'Analyzing URL...';
        } else if (progress <= 60) {
            statusText.textContent = 'Fetching video information...';
        } else if (progress <= 90) {
            statusText.textContent = 'Preparing download options...';
        }
        
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 300);
}

function hideLoading() {
    document.getElementById('loadingSection').style.display = 'none';
}

function showVideoInfo(info) {
    const section = document.getElementById('videoInfoSection');
    section.style.display = 'block';
    
    document.getElementById('videoTitle').textContent = info.title || 'Unknown';
    document.getElementById('videoAuthor').textContent = info.author || 'Unknown';
    document.getElementById('videoDuration').textContent = info.duration ? formatDuration(info.duration) : 'Unknown';
    document.getElementById('videoViews').textContent = info.views ? formatNumber(info.views) : 'Unknown';
}

function showDownloadOptions(info) {
    const section = document.getElementById('downloadOptions');
    const grid = document.getElementById('optionsGrid');
    section.style.display = 'block';
    
    // Clear previous options
    grid.innerHTML = '';
    
    if (currentPlatform === 'tiktok') {
        // TikTok options
        const options = [
            {
                icon: 'fas fa-video',
                title: 'Video HD',
                description: 'Download without watermark',
                quality: 'best',
                type: 'video'
            },
            {
                icon: 'fas fa-music',
                title: 'Audio MP3',
                description: 'Extract audio only',
                quality: 'mp3',
                type: 'audio'
            },
            {
                icon: 'fas fa-film',
                title: 'Video 720p',
                description: 'Medium quality',
                quality: '720',
                type: 'video'
            }
        ];
        
        options.forEach(option => {
            const card = createOptionCard(option);
            grid.appendChild(card);
        });
    } else {
        // YouTube options
        const options = [
            {
                icon: 'fas fa-hd',
                title: 'Video 1080p',
                description: 'Best quality video + audio',
                quality: '1080',
                type: 'video'
            },
            {
                icon: 'fas fa-film',
                title: 'Video 720p',
                description: 'Good quality, smaller size',
                quality: '720',
                type: 'video'
            },
            {
                icon: 'fas fa-file-video',
                title: 'Video 480p',
                description: 'Standard quality',
                quality: '480',
                type: 'video'
            },
            {
                icon: 'fas fa-music',
                title: 'Audio MP3',
                description: 'High quality audio',
                quality: 'mp3',
                type: 'audio'
            },
            {
                icon: 'fas fa-list',
                title: 'More Options',
                description: 'Show all available formats',
                quality: 'list',
                type: 'list'
            }
        ];
        
        options.forEach(option => {
            const card = createOptionCard(option);
            grid.appendChild(card);
        });
    }
}

function createOptionCard(option) {
    const card = document.createElement('div');
    card.className = 'option-card';
    
    card.innerHTML = `
        <i class="${option.icon}"></i>
        <h4>${option.title}</h4>
        <p>${option.description}</p>
        <button onclick="downloadVideo('${option.type}', '${option.quality}')">
            <i class="fas fa-download"></i> Download
        </button>
    `;
    
    return card;
}

async function downloadVideo(type, quality) {
    if (!currentVideoInfo) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: currentVideoInfo.url,
                platform: currentPlatform,
                type: type,
                quality: quality
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.downloadUrl) {
            showResult(data);
        } else {
            showError(data.error || 'Download failed');
        }
    } catch (error) {
        showError('Network error. Please try again.');
        console.error(error);
    } finally {
        hideLoading();
    }
}

function showResult(data) {
    const section = document.getElementById('resultSection');
    const message = document.getElementById('resultMessage');
    const downloadLink = document.getElementById('downloadLink');
    
    section.style.display = 'block';
    document.getElementById('videoInfoSection').style.display = 'none';
    document.getElementById('downloadOptions').style.display = 'none';
    
    message.textContent = `Your ${data.type} is ready to download`;
    downloadLink.href = data.downloadUrl;
    downloadLink.download = data.filename || 'download';
    
    // Scroll to result
    section.scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
    const section = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    
    section.style.display = 'block';
    errorMessage.textContent = message;
    
    // Scroll to error
    section.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    document.getElementById('errorSection').style.display = 'none';
}

function resetForm() {
    document.getElementById('urlInput').value = '';
    document.getElementById('videoInfoSection').style.display = 'none';
    document.getElementById('downloadOptions').style.display = 'none';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    currentVideoInfo = null;
}

function formatDuration(seconds) {
    if (!seconds) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Initialize
console.log('Downloader Online');
