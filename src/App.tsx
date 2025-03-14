import React, { useEffect, useState } from 'react';

interface Video {
  url: string;
  channelName: string;
}

const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  useEffect(() => {
    loadChannelList();
    const interval = setInterval(loadChannelList, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadChannelList = async () => {
    try {
      const response = await fetch('/getList');
      const data = await response.text();
      const urls = data.split('\n').filter(url => url.trim() !== '');
      const videoList = urls.map(url => ({
        url,
        channelName: extractChannelName(url)
      }));
      setVideos(videoList);
    } catch (error) {
      console.error('Error loading channel list:', error);
    }
  };

  const extractChannelName = (url: string): string => {
    // This is a placeholder. You'll need to implement the actual channel name extraction
    return url.split('/').pop() || 'Unknown Channel';
  };

  const addNewVideo = async () => {
    const url = prompt('Enter YouTube video URL:');
    if (!url) return;

    try {
      const channelName = extractChannelName(url);
      const response = await fetch('/addVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, channelName }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
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

  return (
    <div className="container">
      <div className="video-container">
        {currentVideo ? (
          <iframe
            src={`https://www.youtube.com/embed/${currentVideo.split('v=')[1]}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
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