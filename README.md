# YouTube Canlı Yayın Oynatıcı

Bu web uygulaması, YouTube'daki aktif canlı yayınları otomatik olarak listeler ve seçilen yayını oynatır. API anahtarı gerektirmez!

## Özellikler

- YouTube'daki canlı yayınları otomatik listeleme
- API anahtarı gerektirmez
- Yayın önizleme resimleri
- Kanal adı ve yayın başlığı gösterimi
- İzleyici sayısı gösterimi
- Responsive tasarım
- Otomatik yayın listesi güncelleme (5 dakikada bir)
- Modern ve kullanıcı dostu arayüz

## Kurulum

1. Repository'yi klonlayın:
```bash
git clone https://github.com/ErenCankutUYSAL/youtube-video-player.git
```

2. CORS proxy sunucusu kurun (isteğe bağlı):
   - Varsayılan olarak `cors-anywhere.herokuapp.com` kullanılmaktadır
   - Kendi proxy sunucunuzu kurmak için:
     - [CORS Anywhere](https://github.com/Rob--W/cors-anywhere) repository'sini klonlayın
     - Kendi sunucunuza deploy edin
     - `script.js` dosyasındaki `proxyUrl` değişkenini güncelleyin

3. `index.html` dosyasını bir web tarayıcısında açın

## Kullanım

- Sayfa yüklendiğinde, mevcut canlı yayınlar otomatik olarak listelenir
- Listeden bir yayın seçin ve otomatik olarak oynatılacaktır
- Liste 5 dakikada bir otomatik olarak güncellenir
- Yayın listesi kaydırılabilir, böylece tüm yayınları görebilirsiniz

## Önemli Not

Bu uygulama web scraping yöntemini kullanmaktadır. YouTube'un sayfa yapısında değişiklik olması durumunda güncelleme gerekebilir.

## Geliştirme

Yeni özellikler eklemek veya mevcut özellikleri değiştirmek için:

1. Repository'yi forklayın
2. Yeni bir branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: Açıklama'`)
4. Branch'inizi push edin (`git push origin feature/yeniOzellik`)
5. Pull Request oluşturun

## Lisans

MIT