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

    async function fetchLiveStreams() {
        try {
            // CORS proxy URL - Bu URL'yi kendi proxy sunucunuzla değiştirin
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const youtubeUrl = 'https://www.youtube.com/live';
            
            const response = await fetch(proxyUrl + youtubeUrl);
            const html = await response.text();
            
            // HTML içeriğini parse et
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Canlı yayın verilerini çıkar
            const scripts = doc.querySelectorAll('script');
            let initialData;
            
            scripts.forEach(script => {
                if (script.textContent.includes('ytInitialData')) {
                    const match = script.textContent.match(/var ytInitialData = (.+);/);
                    if (match) {
                        initialData = JSON.parse(match[1]);
                    }
                }
            });

            if (initialData) {
                // Canlı yayınları bul ve listeye ekle
                const streams = extractLiveStreams(initialData);
                updateVideoList(streams);
            }
        } catch (error) {
            console.error('Canlı yayınlar yüklenirken hata oluştu:', error);
            videoList.innerHTML = '<li class="error">Canlı yayınlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</li>';
        }
    }

    function extractLiveStreams(data) {
        const streams = [];
        try {
            // YouTube'un veri yapısını analiz et ve canlı yayınları çıkar
            const contents = data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents;
            
            contents.forEach(section => {
                if (section.itemSectionRenderer) {
                    const items = section.itemSectionRenderer.contents;
                    items.forEach(item => {
                        if (item.videoRenderer) {
                            const video = item.videoRenderer;
                            streams.push({
                                id: video.videoId,
                                title: video.title.runs[0].text,
                                thumbnail: video.thumbnail.thumbnails[0].url,
                                channel: video.ownerText.runs[0].text,
                                viewers: video.viewCountText?.runs[0]?.text || '0 izleyici'
                            });
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Veri çıkarma hatası:', error);
        }
        return streams;
    }

    function updateVideoList(streams) {
        videoList.innerHTML = '';
        streams.forEach(stream => {
            const li = document.createElement('li');
            li.setAttribute('data-url', `https://www.youtube.com/watch?v=${stream.id}`);
            li.innerHTML = `
                <div class="stream-item">
                    <img src="${stream.thumbnail}" alt="${stream.title}">
                    <div class="stream-info">
                        <h3>${stream.title}</h3>
                        <p>${stream.channel}</p>
                        <span class="viewers">${stream.viewers}</span>
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
    }

    // Her 5 dakikada bir canlı yayın listesini güncelle
    fetchLiveStreams();
    setInterval(fetchLiveStreams, 5 * 60 * 1000);

    videoList.addEventListener('click', function(event) {
        const listItem = event.target.closest('li');
        if (listItem) {
            const videoUrl = listItem.getAttribute('data-url');
            playVideo(videoUrl, listItem);
        }
    });
});