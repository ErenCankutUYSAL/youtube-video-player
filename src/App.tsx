import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';

interface Video {
  url: string;
  channelName: string;
  type: 'youtube' | 'custom';
}

const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannelList();
    const interval = setInterval(loadChannelList, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadChannelList = async () => {
    try {
      const response = await axios.get('http://localhost:3001/getList');
      setVideos(response.data);
      if (!currentVideo && response.data.length > 0) {
        setCurrentVideo(response.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading channel list:', error);
      setLoading(false);
    }
  };

  const addVideo = async () => {
    const url = prompt('Enter video URL:');
    if (!url) return;

    try {
      await axios.post('http://localhost:3001/addVideo', { url });
      loadChannelList();
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Failed to add video. Please try again.');
    }
  };

  const renderVideoPlayer = () => {
    if (!currentVideo) {
      return <div className="no-video">No video selected</div>;
    }

    if (currentVideo.type === 'youtube') {
      const videoId = currentVideo.url.split('v=')[1];
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    } else {
      // For custom streams like Show TV, embed the video player directly
      const embedUrl = currentVideo.url.includes('showtv.com.tr') 
        ? 'https://www.showtv.com.tr/canli-yayin/frame'
        : currentVideo.url;
      
      return (
        <iframe
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none', width: '100%', height: '100%' }}
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
          <h2>Channels</h2>
          <button className="add-button" onClick={addVideo}>
            Add Channel
          </button>
        </div>
        <div className="channel-list">
          {loading ? (
            <div className="loading">Loading channels...</div>
          ) : videos.length === 0 ? (
            <div className="no-channels">No channels added yet</div>
          ) : (
            videos.map((video, index) => (
              <div
                key={index}
                className={`channel-item ${video.type === 'custom' ? 'custom-stream' : ''}`}
                onClick={() => setCurrentVideo(video)}
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