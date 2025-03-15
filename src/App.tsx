import React, { useEffect, useState, useCallback } from 'react';

interface Video {
  url: string;
  channelName: string;
}

const API_BASE_URL = 'http://localhost:3001';

const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  const loadChannelList = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getList`);
      const data = await response.text();
      const urls = data.split('\n').filter(url => url.trim() !== '');
      const videoList = await Promise.all(urls.map(async url => ({
        url,
        channelName: await extractChannelName(url)
      })));
      setVideos(videoList);
    } catch (error) {
      console.error('Error loading channel list:', error);
    }
  }, []);

  useEffect(() => {
    loadChannelList();
    const interval = setInterval(loadChannelList, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [loadChannelList]);

  const extractChannelName = async (url: string): Promise<string> => {
    try {
      // Önce URL'den video ID'sini al
      const videoId = getVideoId(url);
      if (!videoId) return 'Unknown Channel';

      // YouTube sayfasını getir
      const response = await fetch(`${API_BASE_URL}/getVideoInfo?videoId=${videoId}`);
      const html = await response.text();

      // HTML içeriğinden kanal adını çıkar
      const titleMatch = html.match(/<a[^>]*class="[^"]*ytp-title-link[^"]*"[^>]*>([^<]+)<\/a>/);
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].trim();
      }

      // Eğer başlık bulunamazsa URL'den çıkarmayı dene
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        if (pathSegments[0] === 'channel' || pathSegments[0] === 'c' || pathSegments[0] === 'user') {
          return pathSegments[1] || 'Unknown Channel';
        }
      }
      return 'Unknown Channel';
    } catch (error) {
      console.error('Error extracting channel name:', error);
      return 'Unknown Channel';
    }
  };

  const addNewVideo = async () => {
    const url = prompt('Enter YouTube video URL:');
    if (!url) return;

    try {
      const channelName = await extractChannelName(url);
      const response = await fetch(`${API_BASE_URL}/addVideo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, channelName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      await loadChannelList();
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Failed to add video. Please try again.');
    }
  };

  const playVideo = (url: string) => {
    setCurrentVideo(url);
  };

  const getVideoId = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v') || '';
      }
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
    } catch (error) {
      console.error('Error parsing video URL:', error);
    }
    return '';
  };

  return (
    <div className="container">
      <div className="video-container">
        {currentVideo ? (
          <iframe
            src={`https://www.youtube.com/embed/${getVideoId(currentVideo)}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video player"
          ></iframe>
        ) : (
          <div className="no-video">Select a channel to play</div>
        )}
      </div>
      <div className="list-container">
        <button onClick={addNewVideo} className="add-button">
          Add New Video
        </button>
        <div className="channel-list">
          {videos.map((video, index) => (
            <div
              key={index}
              className="channel-item"
              onClick={() => playVideo(video.url)}
            >
              {video.channelName}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;