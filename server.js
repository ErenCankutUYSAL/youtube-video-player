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

// Yardımcı fonksiyon: YouTube video ID'sini URL'den çıkarır
function getVideoId(url) {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
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
      .filter(video => video.url && getVideoId(video.url)); // Sadece geçerli YouTube URL'lerini filtrele

    res.json(lines);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Dosya yoksa boş liste döndür
      await fs.writeFile(LIST_FILE, '', 'utf8');
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

  const videoId = getVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    // Mevcut listeyi oku
    let data = '';
    try {
      data = await fs.readFile(LIST_FILE, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const lines = data.split('\n').filter(line => line.trim());
    
    // URL zaten var mı kontrol et
    if (lines.some(line => line.includes(url))) {
      return res.status(400).json({ error: 'Video already exists in the list' });
    }

    // Kanal adını al
    const videoInfo = await axios.get(`http://localhost:${PORT}/getVideoInfo?url=${encodeURIComponent(url)}`);
    const channelName = videoInfo.data.channelName;

    // Yeni videoyu ekle
    const newLine = `${url} | ${channelName}`;
    lines.push(newLine);

    // Listeyi kaydet
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