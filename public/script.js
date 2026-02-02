// script.js - Updated
const API_BASE = '/api';

// Platform selection
document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        resetForm();
    });
});

// Analyze URL
document.getElementById('analyzeBtn').addEventListener('click', analyzeURL);
document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeURL();
});

async function analyzeURL() {
    const url = document.getElementById('urlInput').value.trim();
    const platform = document.querySelector('.platform-btn.active').dataset.platform;
    
    if (!url) {
        showError('Masukkan URL terlebih dahulu');
        return;
    }
    
    // Simple validation
    if (platform === 'tiktok' && !url.includes('tiktok.com') && !url.includes('vm.tiktok') && !url.includes('vt.tiktok')) {
        showError('URL TikTok tidak valid');
        return;
    }
    
    if (platform === 'youtube' && !url.includes('youtube.com') && !url.includes('youtu.be')) {
        showError('URL YouTube tidak valid');
        return;
    }
    
    showLoading();
    
    try {
        // Get video info
        const response = await fetch(`${API_BASE}/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                platform: platform
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showVideoInfo(data);
            showDownloadOptions(data, platform);
        } else {
            showError('Gagal mengambil info video');
        }
    } catch (error) {
        showError('Koneksi error. Coba lagi.');
        console.error(error);
    } finally {
        hideLoading();
    }
}

function showVideoInfo(info) {
    const section = document.getElementById('videoInfoSection');
    section.style.display = 'block';
    
    document.getElementById('videoTitle').textContent = info.title || 'Video';
    document.getElementById('videoAuthor').textContent = info.author || 'User';
    document.getElementById('videoDuration').textContent = info.duration ? formatDuration(info.duration) : 'Unknown';
    document.getElementById('videoViews').textContent = info.views ? formatNumber(info.views) : 'Unknown';
}

function showDownloadOptions(info, platform) {
    const section = document.getElementById('downloadOptions');
    const grid = document.getElementById('optionsGrid');
    section.style.display = 'block';
    
    grid.innerHTML = '';
    
    const options = platform === 'tiktok' ? [
        { icon: 'fas fa-video', title: 'Video HD', desc: 'Tanpa watermark', type: 'video', quality: 'hd' },
        { icon: 'fas fa-music', title: 'Audio MP3', desc: 'Ekstrak audio saja', type: 'audio', quality: 'mp3' }
    ] : [
        { icon: 'fas fa-hd', title: 'Video 1080p', desc: 'Kualitas terbaik', type: 'video', quality: '1080' },
        { icon: 'fas fa-film', title: 'Video 720p', desc: 'Size lebih kecil', type: 'video', quality: '720' },
        { icon: 'fas fa-music', title: 'Audio MP3', desc: 'Kualitas tinggi', type: 'audio', quality: 'mp3' }
    ];
    
    options.forEach(opt => {
        const card = document.createElement('div');
        card.className = 'option-card';
        card.innerHTML = `
            <i class="${opt.icon}"></i>
            <h4>${opt.title}</h4>
            <p>${opt.desc}</p>
            <button onclick="startDownload('${info.url}', '${platform}', '${opt.type}', '${opt.quality}')">
                <i class="fas fa-download"></i> Download
            </button>
        `;
        grid.appendChild(card);
    });
}

async function startDownload(url, platform, type, quality) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                platform: platform,
                type: type,
                quality: quality
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.downloadUrl) {
            // Direct download
            const downloadLink = document.createElement('a');
            downloadLink.href = data.downloadUrl;
            downloadLink.download = data.filename || 'download';
            downloadLink.target = '_blank';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            showSuccess('Download dimulai! Cek browser Anda.');
        } else {
            showError(data.error || 'Download gagal');
        }
    } catch (error) {
        showError('Error koneksi');
        console.error(error);
    } finally {
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('errorSection').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingSection').style.display = 'none';
}

function showError(message) {
    const section = document.getElementById('errorSection');
    document.getElementById('errorMessage').textContent = message;
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
}

function showSuccess(message) {
    alert(message); // Simple alert for success
}

function resetForm() {
    document.getElementById('urlInput').value = '';
    document.getElementById('videoInfoSection').style.display = 'none';
    document.getElementById('downloadOptions').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
}
