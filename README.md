# YouTube Canlı Yayın Oynatıcı

Bu web uygulaması, YouTube'daki aktif canlı yayınları otomatik olarak listeler ve seçilen yayını oynatır.

## Özellikler

- YouTube'daki canlı yayınları otomatik listeleme
- Yayın önizleme resimleri
- Kanal adı ve yayın başlığı gösterimi
- Responsive tasarım
- Otomatik yayın listesi güncelleme (5 dakikada bir)
- Modern ve kullanıcı dostu arayüz

## Kurulum

1. Repository'yi klonlayın:
```bash
git clone https://github.com/ErenCankutUYSAL/youtube-video-player.git
```

2. YouTube Data API anahtarı alın:
   - [Google Cloud Console](https://console.cloud.google.com/)'a gidin
   - Yeni bir proje oluşturun
   - YouTube Data API v3'ü etkinleştirin
   - Kimlik bilgileri oluşturun (API anahtarı)

3. API anahtarınızı `script.js` dosyasında güncelleyin:
```javascript
const API_KEY = 'YOUR_API_KEY'; // Bu satırı kendi API anahtarınızla değiştirin
```

4. `index.html` dosyasını bir web tarayıcısında açın

## Kullanım

- Sayfa yüklendiğinde, mevcut canlı yayınlar otomatik olarak listelenir
- Listeden bir yayın seçin ve otomatik olarak oynatılacaktır
- Liste 5 dakikada bir otomatik olarak güncellenir
- Yayın listesi kaydırılabilir, böylece tüm yayınları görebilirsiniz

## Geliştirme

Yeni özellikler eklemek veya mevcut özellikleri değiştirmek için:

1. Repository'yi forklayın
2. Yeni bir branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: Açıklama'`)
4. Branch'inizi push edin (`git push origin feature/yeniOzellik`)
5. Pull Request oluşturun

## Lisans

MIT