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

// YouTube video ID'sini URL'den çıkarır
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

async function getChannelName(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Farklı yöntemlerle kanal adını bulmaya çalış
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

app.get('/getVideoInfo', async (req, res) => {
  const { url } = req.query;
  
  try {
    const channelName = await getChannelName(url);
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
    const channelName = await getChannelName(url);

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