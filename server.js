const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = 3001;

// Enable CORS
app.use(cors());

// Middleware for parsing JSON and serving static files
app.use(express.static(__dirname));
app.use(express.json());

// GET endpoint for reading list.txt
app.get('/getList', async (req, res) => {
    try {
        let data;
        try {
            data = await fs.readFile('list.txt', 'utf8');
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile('list.txt', '[]');
                data = '[]';
            } else {
                throw error;
            }
        }

        // Parse the JSON data
        let items = [];
        try {
            items = JSON.parse(data);
        } catch (error) {
            // If the file is in old format, convert it
            const oldUrls = data.split('\n').filter(url => url.trim() !== '');
            items = oldUrls.map(url => ({
                url,
                type: url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'custom'
            }));
            // Save in new format
            await fs.writeFile('list.txt', JSON.stringify(items, null, 2));
        }
        res.json(items);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).send('Error reading file');
    }
});

// GET endpoint for fetching video info
app.get('/getVideoInfo', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        let channelName = '';

        // Try different selectors to find the channel name
        channelName = $('meta[property="og:title"]').attr('content') ||
                     $('title').text() ||
                     $('.ytp-title-link').text() ||
                     'Unknown Channel';

        res.json({ channelName: channelName.trim() });
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).send('Error fetching video info');
    }
});

// POST endpoint for adding new videos
app.post('/addVideo', async (req, res) => {
    const { url, type } = req.body;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        let items = [];
        try {
            const data = await fs.readFile('list.txt', 'utf8');
            items = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        // Check if URL already exists
        if (items.some(item => item.url === url)) {
            return res.status(400).send('This channel is already in the list');
        }

        // Add new item
        items.push({
            url,
            type: type || (url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'custom')
        });

        // Save the updated list
        await fs.writeFile('list.txt', JSON.stringify(items, null, 2));
        
        res.json({ message: 'Channel successfully added', url });
    } catch (error) {
        console.error('Error handling video:', error);
        res.status(500).send('Error saving video');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});