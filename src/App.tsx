import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';

interface Video {
  url: string;
  channelName: string;
}

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  // Load channel list
  const loadChannelList = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/getList');
      setVideos(response.data);
      if (!currentVideo && response.data.length > 0) {
        setCurrentVideo(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading channel list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannelList();
    // Refresh list every 5 minutes
    const interval = setInterval(loadChannelList, 300000);
    return () => clearInterval(interval);
  }, []);

  // Add new video
  const addVideo = async () => {
    const url = prompt('Enter YouTube video URL:');
    if (!url) return;

    try {
      await axios.post('http://localhost:3001/addVideo', { url });
      await loadChannelList();
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Failed to add video. Please try again.');
    }
  };

  // Toggle recording
  const toggleRecording = async () => {
    if (!currentVideo) return;

    try {
      if (!isRecording) {
        await axios.post('http://localhost:3001/startRecording', {
          url: currentVideo.url
        });
        setIsRecording(true);
      } else {
        await axios.post('http://localhost:3001/stopRecording', {
          url: currentVideo.url
        });
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      alert('Failed to toggle recording. Please try again.');
    }
  };

  // Bulk import videos
  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const urls = text.split('\n').filter(url => url.trim());
      
      await axios.post('http://localhost:3001/bulkImport', { urls });
      await loadChannelList();
      
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error importing videos:', error);
      alert('Failed to import videos. Please try again.');
    }
  };

  return (
    <div className="container">
      <div className="video-container">
        {currentVideo && (
          <iframe
            src={`${currentVideo.url}?autoplay=1`}
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Video Player"
          />
        )}
      </div>

      <div className="controls">
        <button onClick={addVideo} className="control-button">
          Add Video
        </button>
        <button
          onClick={toggleRecording}
          className={`control-button ${isRecording ? 'recording' : ''}`}
          disabled={!currentVideo}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <input
          type="file"
          accept=".txt"
          onChange={handleBulkImport}
          className="file-input"
          title="Import videos from text file"
        />
      </div>

      <div className="list-container">
        {loading ? (
          <div className="loading">Loading channels...</div>
        ) : (
          <div className="channel-list">
            {videos.map((video, index) => (
              <div
                key={index}
                className={`channel-item ${currentVideo?.url === video.url ? 'active' : ''}`}
                onClick={() => setCurrentVideo(video)}
              >
                {video.channelName}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;