document.addEventListener('DOMContentLoaded', function() {
    const videoList = document.getElementById('videoList');
    const player = document.getElementById('player');
    let activeVideo = null;

    function playVideo(videoUrl, listItem) {
        const videoId = videoUrl.split('v=')[1];
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        
        // Update active state
        if (activeVideo) {
            activeVideo.classList.remove('active');
        }
        listItem.classList.add('active');
        activeVideo = listItem;

        // Update player
        player.innerHTML = `<iframe 
            width="100%" 
            height="100%" 
            src="${embedUrl}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
        ></iframe>`;
    }

    videoList.addEventListener('click', function(event) {
        if (event.target.tagName === 'LI') {
            const videoUrl = event.target.getAttribute('data-url');
            playVideo(videoUrl, event.target);
        }
    });

    // Play first video by default
    const firstVideo = videoList.querySelector('li');
    if (firstVideo) {
        const videoUrl = firstVideo.getAttribute('data-url');
        playVideo(videoUrl, firstVideo);
    }
});