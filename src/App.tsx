import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';

interface Video {
  url: string;
  channelName: string;
}

interface RecordingSchedule {
  hour: number;
  enabled: boolean;
}

const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordingSchedule, setRecordingSchedule] = useState<RecordingSchedule[]>(
    Array.from({ length: 24 }, (_, i) => ({ hour: i, enabled: false }))
  );
  const [isRecording, setIsRecording] = useState(false);

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
    const url = prompt('Enter YouTube video URL:');
    if (!url) return;

    if (!url.includes('youtube.com')) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    try {
      await axios.post('http://localhost:3001/addVideo', { url });
      loadChannelList();
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Failed to add video. Please try again.');
    }
  };

  const bulkImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const urls = text.split('\n').filter(url => url.trim());

        try {
          await axios.post('http://localhost:3001/bulkImport', { urls });
          loadChannelList();
          alert('Channels imported successfully!');
        } catch (error) {
          console.error('Error importing channels:', error);
          alert('Failed to import channels. Please try again.');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  const toggleRecording = async () => {
    if (!currentVideo) return;

    try {
      if (isRecording) {
        await axios.post('http://localhost:3001/stopRecording');
        setIsRecording(false);
      } else {
        const selectedHours = recordingSchedule
          .filter(schedule => schedule.enabled)
          .map(schedule => schedule.hour);

        if (selectedHours.length === 0) {
          alert('Please select at least one hour to record');
          return;
        }

        await axios.post('http://localhost:3001/startRecording', {
          videoUrl: currentVideo.url,
          channelName: currentVideo.channelName,
          schedule: selectedHours
        });
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      alert('Failed to toggle recording. Please try again.');
    }
  };

  const toggleHour = (hour: number) => {
    setRecordingSchedule(prev =>
      prev.map(schedule =>
        schedule.hour === hour
          ? { ...schedule, enabled: !schedule.enabled }
          : schedule
      )
    );
  };

  const renderVideoPlayer = () => {
    if (!currentVideo) {
      return <div className="no-video">No video selected</div>;
    }

    const videoId = currentVideo.url.split('v=')[1];
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  };

  return (
    <div className="container">
      <div className="video-container">
        {renderVideoPlayer()}
      </div>
      <div className="list-container">
        <div className="header">
          <h2>YouTube Channels</h2>
          <div className="button-group">
            <button className="add-button" onClick={addVideo}>
              Add Channel
            </button>
            <button className="import-button" onClick={bulkImport}>
              Import Channels
            </button>
          </div>
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
                className={`channel-item ${currentVideo?.url === video.url ? 'active' : ''}`}
                onClick={() => setCurrentVideo(video)}
              >
                {video.channelName}
              </div>
            ))
          )}
        </div>
        {currentVideo && (
          <div className="recording-section">
            <h3>Recording Schedule</h3>
            <div className="hour-grid">
              {recordingSchedule.map(({ hour, enabled }) => (
                <label key={hour} className="hour-checkbox">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleHour(hour)}
                  />
                  {hour.toString().padStart(2, '0')}:00
                </label>
              ))}
            </div>
            <button
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
