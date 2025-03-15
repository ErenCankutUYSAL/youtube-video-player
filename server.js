// server.js (kısa örnek)

const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
// const schedule = require('node-schedule'); // <-- Artık kullanılmayacaksa yoruma alın

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const LIST_FILE = 'list.txt';

// Bu tür fonksiyonlar varsa devre dışı bırakın veya silin:
// app.post('/startRecording', ...){ ... }
// app.post('/stopRecording', ...){ ... }

// Kayıt için planlamayı iptal etmek istiyorsanız schedule ile ilgili kodu pasifleştirin

// Kanalları listeden çekmek için GET /getList:
app.get('/getList', async (req, res) => {
  try {
    const data = await fs.readFile(LIST_FILE, 'utf8');
    const lines = data
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // "URL | KanalAdı" formatı
        const [url, channelName] = line.split('|').map(s => s.trim());
        return { url, channelName };
      });

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

// Yeni kanal(lar) eklemek için POST /bulkImport
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

    let addedCount = 0;
    for (const url of urls) {
      if (!url.includes('youtube.com')) continue;
      if (existingUrls.has(url)) continue;

      // Not: İsterseniz "kanal adı" elle ya da parse ederek bulabilirsiniz.
      // Burada "varsayılan" diyoruz.
      const channelName = 'Yeni Kanal';
      existingLines.push(`${url} | ${channelName}`);
      existingUrls.add(url);
      addedCount++;
    }

    await fs.writeFile(LIST_FILE, existingLines.join('\n') + '\n', 'utf8');
    res.json({ message: `Added ${addedCount} new videos` });
  } catch (error) {
    console.error('Error importing videos:', error);
    res.status(500).json({ error: 'Failed to import videos' });
  }
});

// Sunucuyu dinlemeye al
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
