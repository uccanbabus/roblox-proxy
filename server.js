const express = require('express');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/publish', async (req, res) => {
    console.log("🚀 İstek geldi, URL düzeltmesi ile Roblox'a iletiliyor...");
    
    const { apiKey, universeId, placeId, fileData } = req.body;

    if (!apiKey || !universeId || !placeId || !fileData) {
        return res.status(400).json({ success: false, error: "Eksik parametre!" });
    }

    try {
        // 🔥 İŞTE KESİN ÇÖZÜM: Fazladan yazılan /universes/ kelimesi kaldırıldı!
        const robloxUrl = `https://apis.roblox.com/universes/v1/${universeId}/places/${placeId}/versions?versionType=Published`;
        
        const binaryBuffer = Buffer.from(fileData, 'utf-8');
        const contentLength = binaryBuffer.length;

        console.log(`📦 Gönderiliyor -> Universe: ${universeId}, Place: ${placeId}, Boyut: ${contentLength} byte`);

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

        const resText = await response.text();
        console.log("📥 Roblox'tan Gelen Ham Cevap:", resText);

        let resData;
        try {
            resData = JSON.parse(resText);
        } catch (e) {
            resData = { rawResponse: resText };
        }

        if (response.ok) {
            console.log("✅ İŞLEM TAMAMEN BAŞARILI! Harita yüklendi.");
            res.status(200).json({ success: true, versionNumber: resData.versionNumber || "Yüklendi" });
        } else {
            console.error(`❌ Roblox API Hatası (${response.status}):`, resText);
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
