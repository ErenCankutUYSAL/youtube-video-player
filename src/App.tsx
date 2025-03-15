import React, { useEffect, useState, useCallback } from 'react';

interface Video {
  url: string;
  channelName: string;
  type: 'youtube' | 'custom';
}

const API_BASE_URL = 'http://localhost:3001';

const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<'youtube' | 'custom'>('youtube');
  const [loading, setLoading] = useState(false);

  const loadChannelList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/getList`);
      const data = await response.json();
      
      const videoList = await Promise.all(
        data.map(async (item: { url: string; type: 'youtube' | 'custom' }) => {
          try {
            if (item.type === 'youtube') {
              const infoResponse = await fetch(`${API_BASE_URL}/getVideoInfo?url=${encodeURIComponent(item.url)}`);
              const info = await infoResponse.json();
              return {
                url: item.url,
                channelName: info.channelName || 'Unknown Channel',
                type: item.type
              };
            } else {
              // Custom streaming URLs
              return {
                url: item.url,
                channelName: item.url.includes('tabii.com') ? 'Tabii TV' : new URL(item.url).hostname,
                type: item.type
              };
            }
          } catch (error) {
            console.error('Error fetching channel info:', error);
            return {
              url: item.url,
              channelName: 'Unknown Channel',
              type: item.type
            };
          }
        })
      );

      setVideos(videoList);
    } catch (error) {
      console.error('Error loading channel list:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannelList();
    const interval = setInterval(loadChannelList, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [loadChannelList]);

  const addNewVideo = async () => {
    const url = prompt('Enter video URL (YouTube or streaming link):');
    if (!url) return;

    try {
      const type = url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'custom';
      
      const response = await fetch(`${API_BASE_URL}/addVideo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, type }),
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

  const playVideo = (video: Video) => {
    setCurrentVideo(video.url);
    setCurrentType(video.type);
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

  const renderVideoPlayer = () => {
    if (!currentVideo) {
      return <div className="no-video">Select a channel to play</div>;
    }

    if (currentType === 'youtube') {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${getVideoId(currentVideo)}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      );
    } else {
      return (
        <iframe
          src={currentVideo}
          frameBorder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Custom video player"
        />
      );
    }
  };

  return (
    <div className="container">
      <div className="video-container">
        {renderVideoPlayer()}
      </div>
      <div className="list-container">
        <div className="header">
          <h2>Video Listesi</h2>
          <button onClick={addNewVideo} className="add-button">
            + Yeni Video Ekle
          </button>
        </div>
        <div className="channel-list">
          {loading ? (
            <div className="loading">Loading channels...</div>
          ) : videos.length === 0 ? (
            <div className="no-channels">Kanal Adı Bulunamadı</div>
          ) : (
            videos.map((video, index) => (
              <div
                key={index}
                className={`channel-item ${video.type === 'custom' ? 'custom-stream' : ''}`}
                onClick={() => playVideo(video)}
              >
                {video.channelName}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default App;