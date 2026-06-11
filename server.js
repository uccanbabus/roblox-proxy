const express = require('express');
const app = express();

app.use(express.json({ limit: '50mb' }));

// Gelen parça verilerini Roblox'un resmi XML formatına dönüştüren fonksiyon
function generateRobloxXML(parts) {
    let xmlItems = '';
    
    parts.forEach((part, index) => {
        // Renk dönüştürme (0-1 arasından Roblox formatına)
        const r = Math.round(part.Color[0] * 255);
        const g = Math.round(part.Color[1] * 255);
        const b = Math.round(part.Color[2] * 255);
        const hexColor = (r << 16) + (g << 8) + b;

        xmlItems += `
        <Item class="${part.ClassName || 'Part'}" referent="RBX${index}">
            <Properties>
                <string name="Name">${part.Name}</string>
                <Vector3 name="size">
                    <X>${part.Size[0]}</X>
                    <Y>${part.Size[1]}</Y>
                    <Z>${part.Size[2]}</Z>
                </Vector3>
                <CoordinateFrame name="CFrame">
                    <X>${part.Position[0]}</X>
                    <Y>${part.Position[1]}</Y>
                    <Z>${part.Position[2]}</Z>
                    <R00>1</R00><R01>0</R01><R02>0</R02>
                    <R10>0</R10><R11>1</R11><R12>0</R12>
                    <R20>0</R20><R21>0</R21><R22>1</R22>
                </CoordinateFrame>
                <Color3uint8 name="Color3uint8">${hexColor}</Color3uint8>
                <token name="Material">256</token>
                <bool name="Anchored">${part.Anchored}</bool>
                <bool name="CanCollide">${part.CanCollide}</bool>
            </Properties>
        </Item>`;
    });

    // Roblox'un standart ana şablon yapısı
    return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
        <External>null</External>
        <External>nil</External>
        <Item class="Workspace" referent="RBXWorkspace">
            <Properties>
                <string name="Name">Workspace</string>
            </Properties>
            ${xmlItems}
        </Item>
    </roblox>`;
}

app.post('/publish', async (req, res) => {
    console.log("📥 Roblox Studio'dan harita verisi geldi, işleniyor...");
    
    const { apiKey, universeId, placeId, parts } = req.body;

    if (!apiKey || !universeId || !placeId || !parts) {
        return res.status(400).json({ success: false, error: "Eksik parametre gönderildi!" });
    }

    try {
        // Dinamik olarak gerçek Roblox XML haritasını üretiyoruz
        const generatedXML = generateRobloxXML(parts);
        const binaryBuffer = Buffer.from(generatedXML, 'utf-8');
        const contentLength = binaryBuffer.length;

        console.log(`🛠️ XML Oluşturuldu. Boyut: ${contentLength} byte. Nesne Sayısı: ${parts.length}`);

        const robloxUrl = `https://apis.roblox.com/universes/v1/${universeId}/places/${placeId}/versions?versionType=Published`;

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
        console.log("📥 Roblox API Yanıtı:", resText);

        if (response.ok) {
            res.status(200).json({ success: true, message: "Harita başarıyla güncellendi!", objectsCount: parts.length });
        } else {
            res.status(response.status).json({ success: false, error: resText });
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
