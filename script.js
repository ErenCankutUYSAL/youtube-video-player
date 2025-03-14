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

    async function fetchChannelInfo(videoUrl) {
        try {
            const videoId = videoUrl.split('v=')[1];
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(`${proxyUrl}https://www.youtube.com/watch?v=${videoId}`);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Kanal adını bul
            const channelName = doc.querySelector('link[itemprop="name"]')?.content || 
                              doc.querySelector('meta[name="author"]')?.content ||
                              'Kanal Adı Bulunamadı';
            
            // Kanal URL'sini bul
            const channelUrl = doc.querySelector('link[itemprop="url"]')?.href || 
                             doc.querySelector('span[itemprop="author"] link[itemprop="url"]')?.href ||
                             videoUrl;
            
            return {
                id: videoId,
                channelName,
                channelUrl
            };
        } catch (error) {
            console.error('Kanal bilgileri alınırken hata:', error);
            return {
                id: videoUrl.split('v=')[1],
                channelName: 'Bilinmeyen Kanal',
                channelUrl: videoUrl
            };
        }
    }

    async function loadChannelList() {
        try {
            const response = await fetch('/getList');
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
            videoList.innerHTML = '<li class="loading">Kanallar yükleniyor...</li>';
            
            const channelPromises = urls.map(url => fetchChannelInfo(url.trim()));
            const channels = await Promise.all(channelPromises);
            
            // Kanalları benzersiz yap (aynı kanaldan birden fazla video varsa tek göster)
            const uniqueChannels = Array.from(new Map(
                channels.map(channel => [channel.channelName, channel])
            ).values());
            
            videoList.innerHTML = '';
            uniqueChannels.forEach(channel => {
                const li = document.createElement('li');
                li.setAttribute('data-url', `https://www.youtube.com/watch?v=${channel.id}`);
                li.innerHTML = `
                    <div class="channel-item">
                        <div class="channel-info">
                            <h3>${channel.channelName}</h3>
                        </div>
                    </div>
                `;
                videoList.appendChild(li);
            });

            // İlk kanalı otomatik seç
            const firstChannel = videoList.querySelector('li');
            if (firstChannel) {
                const videoUrl = firstChannel.getAttribute('data-url');
                playVideo(videoUrl, firstChannel);
            }
        } catch (error) {
            console.error('Kanal listesi güncellenirken hata:', error);
            videoList.innerHTML = '<li class="error">Kanallar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</li>';
        }
    }

    // Her 5 dakikada bir kanal listesini güncelle
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
    window.addNewVideo = async function() {
        const newUrl = prompt('Yeni video URL\'sini girin:');
        if (newUrl && newUrl.includes('youtube.com/watch?v=')) {
            try {
                // Önce kanal bilgilerini al
                const channelInfo = await fetchChannelInfo(newUrl);
                
                const response = await fetch('/addVideo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        url: newUrl,
                        channelName: channelInfo.channelName 
                    })
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(error);
                }

                updateVideoList();
                alert(`"${channelInfo.channelName}" kanalı başarıyla eklendi!`);
            } catch (error) {
                console.error('Yeni kanal eklenirken hata:', error);
                alert('Kanal eklenirken bir hata oluştu: ' + error.message);
            }
        } else {
            alert('Geçerli bir YouTube video URL\'si girin.');
        }
    };
});