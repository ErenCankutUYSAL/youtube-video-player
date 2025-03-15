// script.js

document.addEventListener('DOMContentLoaded', async function () {
  const videoList = document.getElementById('videoList');
  const player = document.getElementById('player');
  let activeVideo = null;

  // Seçili videoyu oynatma
  function playVideo(videoUrl, listItem) {
    // URL'den video ID çekip embed linki oluşturuyoruz
    const videoId = videoUrl.split('v=')[1];
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

    // Aktif videonun CSS'ini kaldıralım
    if (activeVideo) {
      activeVideo.classList.remove('active');
    }
    // Yeni tıklanan videoyu aktif yapalım
    listItem.classList.add('active');
    activeVideo = listItem;

    // iFrame embed et
    player.innerHTML = `
      <iframe
        width="100%"
        height="100%"
        src="${embedUrl}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    `;
  }

  // Kanalları sunucudan JSON olarak çekiyoruz
  async function loadChannelList() {
    try {
      const response = await fetch('/getList');
      // list.txt içeriğinden URL ve Kanal Adı bilgilerini JSON olarak alıyoruz
      const data = await response.json();  // [{ url, channelName }, ... ]
      return data;
    } catch (error) {
      console.error('Kanal listesi alınırken hata:', error);
      return [];
    }
  }

  // Listeyi DOM'a basıp ilk videoyu otomatik oynat
  async function updateVideoList() {
    try {
      videoList.innerHTML = '<li class="loading">Kanallar yükleniyor...</li>';
      
      const channels = await loadChannelList();
      videoList.innerHTML = '';

      channels.forEach(channel => {
        const li = document.createElement('li');
        // Sunucudan gelen channel.url içindeki video linki
        li.setAttribute('data-url', channel.url);
        li.innerHTML = `
          <div class="channel-item">
            <div class="channel-info">
              <h3>${channel.channelName}</h3>
            </div>
          </div>
        `;
        videoList.appendChild(li);
      });

      // İlk kanalı otomatik oynat
      const firstChannel = videoList.querySelector('li');
      if (firstChannel) {
        const videoUrl = firstChannel.getAttribute('data-url');
        playVideo(videoUrl, firstChannel);
      }
    } catch (error) {
      console.error('Liste güncellenirken hata:', error);
      videoList.innerHTML = '<li class="error">Kanallar yüklenirken bir hata oluştu.</li>';
    }
  }

  // Sayfa yüklendiğinde ve her 5 dakikada bir listeyi güncelle
  updateVideoList();
  setInterval(updateVideoList, 5 * 60 * 1000);

  // Listedeki öğeye tıklayınca oynat
  videoList.addEventListener('click', event => {
    const listItem = event.target.closest('li');
    if (
      listItem &&
      !listItem.classList.contains('loading') &&
      !listItem.classList.contains('error')
    ) {
      const videoUrl = listItem.getAttribute('data-url');
      playVideo(videoUrl, listItem);
    }
  });

  // Yeni kanal ekleme (list.txt'ye gönderen) özelliği
  // Sunucudaki /bulkImport endpoint’ini kullanır
  window.addNewVideo = async function () {
    const newUrl = prompt('Yeni YouTube video/kanal URL\'si girin:');
    if (!newUrl) return;

    try {
      // Bir dizi içinde tek URL yolluyoruz
      await fetch('/bulkImport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [newUrl] })
      });
      // Yeni URL eklendikten sonra listeyi güncelle
      updateVideoList();
    } catch (error) {
      console.error('Video eklenirken hata:', error);
      alert('Video eklenirken bir hata oluştu!');
    }
  };
});
