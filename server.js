const express = require('express');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/publish', async (req, res) => {
    console.log("🚀 İstek geldi, Fetch ve Content-Length doğrulaması yapılıyor...");
    
    const { apiKey, universeId, placeId, fileData } = req.body;

    if (!apiKey || !universeId || !placeId || !fileData) {
        return res.status(400).json({ success: false, error: "Eksik parametre!" });
    }

    try {
        const robloxUrl = `https://apis.roblox.com/universes/v1/universes/${universeId}/places/${placeId}/versions?versionType=Published`;
        
        // Veriyi tam bir binary Buffer'a çeviriyoruz
        const binaryBuffer = Buffer.from(fileData, 'utf-8');

        // 🔥 AKAMAI'YI YIKACAK SATIR: Verinin tam boyutunu byte olarak hesaplıyoruz
        const contentLength = binaryBuffer.length;

        console.log(`📦 Gönderilecek Harita Boyutu: ${contentLength} byte`);

        // Axios yerine Akamai'nin başlıklarını bozamadığı yerleşik fetch kullanıyoruz
        const response = await fetch(robloxUrl, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/octet-stream',
                'Content-Length': contentLength.toString(), // Akamai'nin zorunlu tuttuğu boyut
                'User-Agent': 'RobloxStudio/WinInet',
                'Connection': 'keep-alive'
            },
            body: binaryBuffer
        });

        const resData = await response.json();

        if (response.ok) {
            console.log("✅ KORUMA TAMAMEN AŞILDI! Roblox yüklemeyi onayladı.");
            res.status(200).json({ success: true, versionNumber: resData.versionNumber });
        } else {
            console.error("❌ Roblox API Hatası:", JSON.stringify(resData));
            res.status(response.status).json({ success: false, error: resData });
        }

    } catch (error) {
        console.error("❌ Sunucu içi hata:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu aktif: ${PORT}`);
});
