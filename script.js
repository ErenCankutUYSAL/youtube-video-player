document.addEventListener('DOMContentLoaded', function() {
    const videoList = document.getElementById('videoList');
    const player = document.getElementById('player');
    let activeVideo = null;

    function playVideo(videoUrl, listItem) {
        const videoId = videoUrl.split('v=')[1];
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        
        if (activeVideo) {
            activeVideo.classList.remove('active');
        }
        listItem.classList.add('active');
        activeVideo = listItem;

        player.innerHTML = `<iframe 
            width="100%" 
            height="100%" 
            src="${embedUrl}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
        ></iframe>`;
    }

    async function fetchVideoInfo(videoUrl) {
        try {
            const videoId = videoUrl.split('v=')[1];
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(`${proxyUrl}https://www.youtube.com/watch?v=${videoId}`);
            const html = await response.text();
            
            // HTML içeriğini parse et
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Meta verilerini çıkar
            const title = doc.querySelector('meta[property="og:title"]')?.content || 'Video Başlığı Bulunamadı';
            const thumbnail = doc.querySelector('meta[property="og:image"]')?.content || '';
            const channelName = doc.querySelector('link[itemprop="name"]')?.content || 'Kanal Adı Bulunamadı';
            
            return {
                id: videoId,
                title,
                thumbnail,
                channelName
            };
        } catch (error) {
            console.error('Video bilgileri alınırken hata:', error);
            return {
                id: videoUrl.split('v=')[1],
                title: 'Video Bilgisi Alınamadı',
                thumbnail: '',
                channelName: 'Bilinmeyen Kanal'
            };
        }
    }

    async function loadChannelList() {
        try {
            const response = await fetch('list.txt');
            const text = await response.text();
            return text.split('\n').filter(url => url.trim() !== '');
        } catch (error) {
            console.error('Kanal listesi yüklenirken hata:', error);
            return [];
        }
    }

    async function updateVideoList() {
        try {
            const urls = await loadChannelList();
            videoList.innerHTML = '<li class="loading">Videolar yükleniyor...</li>';
            
            const videoPromises = urls.map(url => fetchVideoInfo(url.trim()));
            const videos = await Promise.all(videoPromises);
            
            videoList.innerHTML = '';
            videos.forEach(video => {
                const li = document.createElement('li');
                li.setAttribute('data-url', `https://www.youtube.com/watch?v=${video.id}`);
                li.innerHTML = `
                    <div class="stream-item">
                        <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='placeholder.png'">
                        <div class="stream-info">
                            <h3>${video.title}</h3>
                            <p>${video.channelName}</p>
                        </div>
                    </div>
                `;
                videoList.appendChild(li);
            });

            // İlk videoyu otomatik oynat
            const firstVideo = videoList.querySelector('li');
            if (firstVideo) {
                const videoUrl = firstVideo.getAttribute('data-url');
                playVideo(videoUrl, firstVideo);
            }
        } catch (error) {
            console.error('Video listesi güncellenirken hata:', error);
            videoList.innerHTML = '<li class="error">Videolar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</li>';
        }
    }

    // Her 5 dakikada bir video listesini güncelle
    updateVideoList();
    setInterval(updateVideoList, 5 * 60 * 1000);

    videoList.addEventListener('click', function(event) {
        const listItem = event.target.closest('li');
        if (listItem && !listItem.classList.contains('loading') && !listItem.classList.contains('error')) {
            const videoUrl = listItem.getAttribute('data-url');
            playVideo(videoUrl, listItem);
        }
    });

    // Yeni video URL'si ekleme fonksiyonu
    window.addNewVideo = function() {
        const newUrl = prompt('Yeni video URL\'sini girin:');
        if (newUrl && newUrl.includes('youtube.com/watch?v=')) {
            fetch('list.txt')
                .then(response => response.text())
                .then(content => {
                    const urls = content.split('\n').filter(url => url.trim() !== '');
                    if (!urls.includes(newUrl)) {
                        urls.push(newUrl);
                        const newContent = urls.join('\n');
                        // Burada sunucuya kaydetme işlemi yapılmalı
                        // Şimdilik sadece listeyi güncelliyoruz
                        updateVideoList();
                    } else {
                        alert('Bu video zaten listede!');
                    }
                })
                .catch(error => {
                    console.error('Yeni video eklenirken hata:', error);
                    alert('Video eklenirken bir hata oluştu.');
                });
        } else {
            alert('Geçerli bir YouTube video URL\'si girin.');
        }
    };
});