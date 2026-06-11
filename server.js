const express = require('express');
const axios = require('axios');
const app = express();

// Büyük harita verilerini sorunsuz alabilmek için limiti artırdık ve ham veri işlemeyi açtık
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));

app.post('/publish', async (req, res) => {
    console.log("🚀 İstek geldi, Roblox taklit edilerek gönderiliyor...");
    
    const { apiKey, universeId, placeId, fileData } = req.body;

    if (!apiKey || !universeId || !placeId || !fileData) {
        return res.status(400).json({ success: false, error: "Eksik parametre gönderildi!" });
    }

    try {
        const robloxUrl = `https://apis.roblox.com/universes/v1/universes/${universeId}/places/${placeId}/versions?versionType=Published`;
        
        // Roblox WAF'ı tamamen atlatmak için %100 Studio Taklidi Headers
        const response = await axios.post(robloxUrl, fileData, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/octet-stream',
                'User-Agent': 'RobloxStudio/WinInet', // Roblox'un kendi tarayıcı kimliği
                'Accept': 'application/json, text/plain, */*',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log("✅ Roblox API Yüklemeyi Başarıyla Onayladı!");
        res.status(200).json({ success: true, versionNumber: response.data.versionNumber });
    } catch (error) {
        console.error("❌ Roblox API Hatası oluştu.");
        if (error.response) {
            console.error(JSON.stringify(error.response.data));
            res.status(500).json({ success: false, error: error.response.data });
        } else {
            console.error(error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Vercel için port dinleme ayarı
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
