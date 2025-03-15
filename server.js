const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const ytdl = require('ytdl-core');
const schedule = require('node-schedule');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const LIST_FILE = 'list.txt';
const RECORDINGS_DIR = 'recordings';

// Kayıt işlemlerini takip etmek için
let activeRecordings = new Map();

// Kayıt dizinini oluştur
(async () => {
  try {
    await fs.access(RECORDINGS_DIR);
  } catch {
    await fs.mkdir(RECORDINGS_DIR);
  }
})();

function getVideoId(url) {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

async function getChannelName(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    let channelName = '';
    
    // 1. Video başlığından kanal adını al
    const title = $('title').text();
    if (title) {
      const titleParts = title.split('-');
      if (titleParts.length > 1) {
        channelName = titleParts[0].trim();
      }
    }
    
    // 2. Meta verilerinden kanal adını al
    if (!channelName) {
      channelName = $('meta[itemprop="channelName"]').attr('content') ||
                   $('meta[property="og:site_name"]').attr('content');
    }
    
    // 3. Kanal linki üzerinden al
    if (!channelName) {
      channelName = $('#owner-name a').text() ||
                   $('.ytd-channel-name').text();
    }
    
    // 4. Video açıklamasından al
    if (!channelName) {
      const description = $('meta[name="description"]').attr('content');
      if (description) {
        const descParts = description.split('|');
        if (descParts.length > 0) {
          channelName = descParts[0].trim();
        }
      }
    }

    return channelName || 'YouTube Channel';
  } catch (error) {
    console.error('Error fetching channel name:', error);
    return 'YouTube Channel';
  }
}

app.get('/getList', async (req, res) => {
  try {
    const data = await fs.readFile(LIST_FILE, 'utf8');
    const lines = data.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [url, channelName] = line.split('|').map(s => s.trim());
        return { url, channelName };
      })
      .filter(video => video.url && getVideoId(video.url));

    res.json(lines);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(LIST_FILE, '', 'utf8');
      res.json([]);
    } else {
      console.error('Error reading list:', error);
      res.status(500).json({ error: 'Failed to read channel list' });
    }
  }
});

app.post('/bulkImport', async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'URLs array is required' });
  }

  try {
    let data = '';
    try {
      data = await fs.readFile(LIST_FILE, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const existingLines = data.split('\n').filter(line => line.trim());
    const existingUrls = new Set(existingLines.map(line => line.split('|')[0].trim()));

    const newVideos = [];
    for (const url of urls) {
      if (!url.includes('youtube.com')) continue;
      if (existingUrls.has(url)) continue;

      const channelName = await getChannelName(url);
      newVideos.push(`${url} | ${channelName}`);
    }

    if (newVideos.length > 0) {
      const allLines = [...existingLines, ...newVideos];
      await fs.writeFile(LIST_FILE, allLines.join('\n') + '\n');
    }

    res.json({ message: `Added ${newVideos.length} new videos` });
  } catch (error) {
    console.error('Error importing videos:', error);
    res.status(500).json({ error: 'Failed to import videos' });
  }
});

app.post('/startRecording', async (req, res) => {
  const { videoUrl, channelName, schedule: recordingHours } = req.body;

  if (!videoUrl || !channelName || !recordingHours) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Önceki kayıtları iptal et
    if (activeRecordings.has(videoUrl)) {
      activeRecordings.get(videoUrl).forEach(job => job.cancel());
    }

    // Her saat için yeni kayıt planla
    const jobs = recordingHours.map(hour => {
      return schedule.scheduleJob(`0 ${hour} * * *`, async () => {
        const date = new Date();
        const fileName = `${channelName}_${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}_${hour.toString().padStart(2, '0')}.mp4`;
        const filePath = path.join(RECORDINGS_DIR, fileName);

        try {
          const videoStream = ytdl(videoUrl, { quality: 'highest' });
          
          ffmpeg(videoStream)
            .duration(3600) // 1 saat
            .toFormat('mp4')
            .on('end', () => {
              console.log(`Recording completed: ${fileName}`);
            })
            .on('error', (err) => {
              console.error(`Recording error: ${fileName}`, err);
            })
            .save(filePath);
        } catch (error) {
          console.error(`Failed to record: ${fileName}`, error);
        }
      });
    });

    activeRecordings.set(videoUrl, jobs);
    res.json({ message: 'Recording scheduled successfully' });
  } catch (error) {
    console.error('Error starting recording:', error);
    res.status(500).json({ error: 'Failed to start recording' });
  }
});

app.post('/stopRecording', async (req, res) => {
  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  try {
    if (activeRecordings.has(videoUrl)) {
      activeRecordings.get(videoUrl).forEach(job => job.cancel());
      activeRecordings.delete(videoUrl);
    }

    res.json({ message: 'Recording stopped successfully' });
  } catch (error) {
    console.error('Error stopping recording:', error);
    res.status(500).json({ error: 'Failed to stop recording' });
  }
});

app.post('/addVideo', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const videoId = getVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    let data = '';
    try {
      data = await fs.readFile(LIST_FILE, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const lines = data.split('\n').filter(line => line.trim());
    
    if (lines.some(line => line.includes(url))) {
      return res.status(400).json({ error: 'Video already exists in the list' });
    }

    const channelName = await getChannelName(url);
    const newLine = `${url} | ${channelName}`;
    lines.push(newLine);

    await fs.writeFile(LIST_FILE, lines.join('\n') + '\n');
    res.json({ message: 'Video added successfully' });
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ error: 'Failed to add video' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
