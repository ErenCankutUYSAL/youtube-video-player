const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const LIST_FILE = 'list.txt';

app.get('/getList', async (req, res) => {
  try {
    const data = await fs.readFile(LIST_FILE, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    const videos = lines.map(line => {
      const [url, channelName] = line.split('|').map(s => s.trim());
      return { url, channelName: channelName || 'Unknown Channel' };
    });
    res.json(videos);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      console.error('Error reading list:', error);
      res.status(500).json({ error: 'Failed to read channel list' });
    }
  }
});

app.get('/getVideoInfo', async (req, res) => {
  const { url } = req.query;
  
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const channelName = $('meta[itemprop="channelName"]').attr('content') || 
                       $('#owner-name a').text() ||
                       'Unknown Channel';
    res.json({ channelName });
  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

app.post('/addVideo', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!url.includes('youtube.com')) {
    return res.status(400).json({ error: 'Only YouTube URLs are allowed' });
  }

  try {
    // Read existing list
    let data = '';
    try {
      data = await fs.readFile(LIST_FILE, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const lines = data.split('\n').filter(line => line.trim());
    
    // Check for duplicates
    if (lines.some(line => line.split('|')[0].trim() === url)) {
      return res.status(400).json({ error: 'URL already exists in the list' });
    }

    // Get channel name
    const videoInfo = await axios.get(`http://localhost:${PORT}/getVideoInfo?url=${encodeURIComponent(url)}`);
    const channelName = videoInfo.data.channelName;

    // Add new video
    const newLine = `${url} | ${channelName}`;
    lines.push(newLine);

    // Save updated list
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