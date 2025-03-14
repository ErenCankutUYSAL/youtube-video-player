const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Statik dosyalar için middleware
app.use(express.static(__dirname));
app.use(express.json());

// list.txt dosyasını okuma endpoint'i
app.get('/getList', (req, res) => {
    fs.readFile('list.txt', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Dosya okuma hatası');
            return;
        }
        res.send(data);
    });
});

// list.txt dosyasına yazma endpoint'i
app.post('/addVideo', (req, res) => {
    const { url, channelName } = req.body;
    if (!url) {
        res.status(400).send('URL gerekli');
        return;
    }

    fs.readFile('list.txt', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Dosya okuma hatası');
            return;
        }

        const urls = data.split('\n').filter(line => line.trim() !== '');
        
        // URL'nin zaten listede olup olmadığını kontrol et
        if (urls.includes(url)) {
            res.status(400).send('Bu kanal zaten listede mevcut');
            return;
        }

        // Yeni URL'yi dosyaya ekle
        const newLine = urls.length > 0 ? '\n' + url : url;
        fs.appendFile('list.txt', newLine, (err) => {
            if (err) {
                res.status(500).send('Dosya yazma hatası');
                return;
            }
            res.send(`${channelName} başarıyla eklendi`);
        });
    });
});

app.listen(port, () => {
    console.log(`Server http://localhost:${port} adresinde çalışıyor`);
});