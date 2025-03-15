const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { spawn } = require('child_process');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Store active recordings
const activeRecordings = new Map();

// Ensure recordings directory exists
const recordingsDir = path.join(__dirname, 'recordings');
fs.mkdir(recordingsDir, { recursive: true }).catch(console.error);

// Helper function to get video ID from URL
function getVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Helper function to extract channel name
async function getChannelName(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        return $('meta[name="author"]').attr('content') || 'Unknown Channel';
    } catch (error) {
        console.error('Error fetching channel name:', error);
        return 'Unknown Channel';
    }
}

// Read list.txt
app.get('/getList', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'list.txt'), 'utf8');
        const lines = data.split('\n').filter(line => line.trim());
        const videos = [];

        for (const line of lines) {
            try {
                const url = line.trim();
                const channelName = await getChannelName(url);
                videos.push({ url, channelName });
            } catch (error) {
                console.error('Error processing video:', error);
            }
        }

        res.json(videos);
    } catch (error) {
        console.error('Error reading list:', error);
        res.status(500).json({ error: 'Failed to read video list' });
    }
});

// Add new video
app.post('/addVideo', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const data = await fs.readFile(path.join(__dirname, 'list.txt'), 'utf8');
        const videos = data.split('\n').filter(line => line.trim());

        if (videos.includes(url)) {
            return res.status(400).json({ error: 'Video already exists' });
        }

        await fs.appendFile(path.join(__dirname, 'list.txt'), `\n${url}`);
        res.json({ message: 'Video added successfully' });
    } catch (error) {
        console.error('Error adding video:', error);
        res.status(500).json({ error: 'Failed to add video' });
    }
});

// Start recording
app.post('/startRecording', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = path.join(recordingsDir, `recording-${timestamp}.mp4`);

        const ffmpeg = spawn('ffmpeg', [
            '-i', url,
            '-c:v', 'copy',
            '-c:a', 'copy',
            outputPath
        ]);

        activeRecordings.set(url, ffmpeg);
        res.json({ message: 'Recording started' });
    } catch (error) {
        console.error('Error starting recording:', error);
        res.status(500).json({ error: 'Failed to start recording' });
    }
});

// Stop recording
app.post('/stopRecording', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const ffmpeg = activeRecordings.get(url);
        if (ffmpeg) {
            ffmpeg.kill('SIGINT');
            activeRecordings.delete(url);
            res.json({ message: 'Recording stopped' });
        } else {
            res.status(400).json({ error: 'No active recording found' });
        }
    } catch (error) {
        console.error('Error stopping recording:', error);
        res.status(500).json({ error: 'Failed to stop recording' });
    }
});

// Bulk import videos
app.post('/bulkImport', async (req, res) => {
    try {
        const { urls } = req.body;
        if (!Array.isArray(urls)) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        const existingData = await fs.readFile(path.join(__dirname, 'list.txt'), 'utf8');
        const existingUrls = existingData.split('\n').filter(line => line.trim());
        const newUrls = urls.filter(url => !existingUrls.includes(url.trim()));

        if (newUrls.length > 0) {
            await fs.appendFile(path.join(__dirname, 'list.txt'), '\n' + newUrls.join('\n'));
        }

        res.json({ 
            message: 'Bulk import completed',
            added: newUrls.length,
            skipped: urls.length - newUrls.length
        });
    } catch (error) {
        console.error('Error in bulk import:', error);
        res.status(500).json({ error: 'Failed to import videos' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});