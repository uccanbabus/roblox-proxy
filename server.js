const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/publish', async (req, res) => {
    console.log("🚀 İstek geldi, veri Binary Buffer'a dönüştürülüyor...");
    
    const { apiKey, universeId, placeId, fileData } = req.body;

    if (!apiKey || !universeId || !placeId || !fileData) {
        return res.status(400).json({ success: false, error: "Eksik parametre!" });
    }

    try {
        const robloxUrl = `https://apis.roblox.com/universes/v1/universes/${universeId}/places/${placeId}/versions?versionType=Published`;
        
        // 🔥 İŞTE SİHİRLİ DOKUNUŞ: Yazıyı ham binary veriye çeviriyoruz.
        // Akamai artık bu verinin içini okuyup "XML saldırısı" diyemeyecek.
        const binaryBuffer = Buffer.from(fileData, 'utf-8');

        const response = await axios.post(robloxUrl, binaryBuffer, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/octet-stream',
                'User-Agent': 'RobloxStudio/WinInet',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            }
        });

        console.log("✅ KORUMA AŞILDI! Roblox yüklemeyi onayladı.");
        res.status(200).json({ success: true, versionNumber: response.data.versionNumber });
    } catch (error) {
        console.error("❌ Roblox API/WAF Hatası:");
        if (error.response) {
            console.error(JSON.stringify(error.response.data));
            res.status(500).json({ success: false, error: error.response.data });
        } else {
            console.error(error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu aktif: ${PORT}`);
});
