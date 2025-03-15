# YouTube Video Player

Bu proje, YouTube kanallarını kolayca izleyebileceğiniz bir web uygulamasıdır. Kanal listesini `list.txt` dosyasından okur ve seçilen kanalı otomatik olarak oynatır.

## Özellikler

- YouTube kanallarını liste halinde görüntüleme
- Otomatik kanal adı çekme
- Kanal listesini `list.txt` dosyasından okuma
- Yeni kanal ekleme özelliği
- Responsive tasarım
- 5 dakikada bir otomatik liste güncelleme

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/ErenCankutUYSAL/youtube-video-player.git
cd youtube-video-player
```

2. Gerekli paketleri yükleyin:
```bash
npm install
```

3. Sunucuyu başlatın:
```bash
npm run server
```

4. Yeni bir terminal açın ve React uygulamasını başlatın:
```bash
npm start
```

5. Tarayıcınızda `http://localhost:3000` adresine gidin

## Kanal Listesi Formatı

Kanallar `list.txt` dosyasında aşağıdaki formatta saklanır:

```
https://www.youtube.com/watch?v=VIDEO_ID | Kanal Adı
```

Örnek:
```
https://www.youtube.com/watch?v=jfKfPfyJRdk | Lofi Girl
https://www.youtube.com/watch?v=5qap5aO4i9A | ChilledCow
```

## Teknolojiler

- React
- TypeScript
- Express.js
- Axios
- Cheerio

## Geliştirme

### Sunucu (server.js)

Sunucu aşağıdaki endpoint'leri sağlar:

- `GET /getList`: Kanal listesini döndürür
- `GET /getVideoInfo`: YouTube video bilgilerini çeker
- `POST /addVideo`: Yeni kanal ekler

### Frontend (App.tsx)

- Video oynatıcı
- Kanal listesi
- Yeni kanal ekleme arayüzü
- Responsive tasarım

## Katkıda Bulunma

1. Bu projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Eren Cankut UYSAL - [@ErenCankutUYSAL](https://github.com/ErenCankutUYSAL)

Proje Linki: [https://github.com/ErenCankutUYSAL/youtube-video-player](https://github.com/ErenCankutUYSAL/youtube-video-player)