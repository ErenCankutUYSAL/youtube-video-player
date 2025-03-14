// YouTube API anahtarınızı buraya ekleyin
const API_KEY = 'YOUR_API_KEY';

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
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&maxResults=25&key=${API_KEY}`);
            const data = await response.json();
            
            if (data.items) {
                videoList.innerHTML = ''; // Mevcut listeyi temizle
                data.items.forEach(item => {
                    const li = document.createElement('li');
                    li.setAttribute('data-url', `https://www.youtube.com/watch?v=${item.id.videoId}`);
                    li.innerHTML = `
                        <div class="stream-item">
                            <img src="${item.snippet.thumbnails.default.url}" alt="${item.snippet.title}">
                            <div class="stream-info">
                                <h3>${item.snippet.title}</h3>
                                <p>${item.snippet.channelTitle}</p>
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
        } catch (error) {
            console.error('Canlı yayınlar yüklenirken hata oluştu:', error);
            videoList.innerHTML = '<li class="error">Canlı yayınlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</li>';
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