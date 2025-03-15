const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3001;

// Enable CORS
app.use(cors());

// Middleware for parsing JSON and serving static files
app.use(express.static(__dirname));
app.use(express.json());

// GET endpoint for reading list.txt
app.get('/getList', (req, res) => {
    fs.readFile('list.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            res.status(500).send('Error reading file');
            return;
        }
        res.send(data);
    });
});

// POST endpoint for adding new videos
app.post('/addVideo', (req, res) => {
    const { url, channelName } = req.body;
    if (!url) {
        res.status(400).send('URL is required');
        return;
    }

    fs.readFile('list.txt', 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error reading file:', err);
            res.status(500).send('Error reading file');
            return;
        }

        const urls = data ? data.split('\n').filter(line => line.trim() !== '') : [];
        
        if (urls.includes(url)) {
            res.status(400).send('This channel is already in the list');
            return;
        }

        const newLine = urls.length > 0 ? '\n' + url : url;
        fs.appendFile('list.txt', newLine, (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                res.status(500).send('Error writing to file');
                return;
            }
            res.json({ message: `${channelName} successfully added`, url });
        });
    });
});

// Create list.txt if it doesn't exist
fs.access('list.txt', fs.constants.F_OK, (err) => {
    if (err) {
        fs.writeFile('list.txt', '', (err) => {
            if (err) {
                console.error('Error creating list.txt:', err);
            }
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});