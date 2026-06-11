const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' })); // Harita verileri büyük olabileceği için limiti artırdık

app.post('/publish', async (req, res) => {
    console.log("🚀 Roblox'tan istek geldi, Roblox API'sine iletiliyor...");
    
    const { apiKey, universeId, placeId, fileData } = req.body;

    try {
        // Roblox'un resmi Open Cloud Place Publishing endpoint'i
        const robloxUrl = `https://apis.roblox.com/universes/v1/universes/${universeId}/places/${placeId}/versions?versionType=Published`;
        
// Veriyi Roblox'un istediği "application/octet-stream" formatında gönderiyoruz
        const response = await axios.post(robloxUrl, fileData, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/octet-stream',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            }
        });

        console.log("✅ Roblox API Yüklemeyi Başarıyla Onayladı!");
        console.log(`Yeni Versiyon Numarası: ${response.data.versionNumber}`);

        res.status(200).json({ success: true, versionNumber: response.data.versionNumber });
    } catch (error) {
        console.error("❌ Roblox API Hatası:");
        if (error.response) {
            console.error(error.response.data);
            res.status(500).json({ success: false, error: error.response.data });
        } else {
            console.error(error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`🌐 Gerçek yönlendirmeli proxy http://localhost:${PORT} adresinde aktif!`);
});