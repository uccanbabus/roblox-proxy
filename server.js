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
        const binaryBuffer = Buffer.from(fileData, 'utf-8');
        const contentLength = binaryBuffer.length;

        const response = await fetch(robloxUrl, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/octet-stream',
                'Content-Length': contentLength.toString(),
                'User-Agent': 'RobloxStudio/WinInet',
                'Connection': 'keep-alive'
            },
            body: binaryBuffer
        });

        // 🔥 İŞTE DEĞİŞİKLİK: Cevabı JSON olarak değil, ham metin (Text) olarak alıyoruz
        const resText = await response.text();
        console.log("📥 Roblox'tan Gelen Ham Cevap:", resText);

        // Metni güvenli bir şekilde JSON'a çevirmeyi deniyoruz
        let resData;
        try {
            resData = JSON.parse(resText);
        } catch (e) {
            resData = { rawResponse: resText };
        }

        if (response.ok) {
            console.log("✅ İşlem Başarılı!");
            res.status(200).json({ success: true, data: resData });
        } else {
            console.error("❌ Roblox Reddetti. Durum Kodu:", response.status);
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
