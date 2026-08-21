const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

function extractVideoId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
}

app.get('/download', async (req, res) => {
    const rawURL = req.query.url;
    if (!rawURL) return res.status(400).send('YouTube linki daxil edilməyib.');

    const videoId = extractVideoId(rawURL);
    if (!videoId) return res.status(400).send('Keçərli YouTube linki deyil.');

    console.log(`>>> [YÜKLƏNİR]: ${videoId}`);

    let streamUrl = null;
    let mimeType = 'audio/webm';
    
    // 1. Şəbəkə: Daha stabil və yeni Piped API-ləri
    const pipedInstances = [
        'https://pipedapi.smnz.de',
        'https://pipedapi.adminforge.de',
        'https://piped-api.garudalinux.org',
        'https://pipedapi.drgns.space',
        'https://pipedapi.kavin.rocks'
    ];

    // 2. Şəbəkə: Piped serverləri çökərsə, Invidious API-ləri ehtiyat kimi işə düşür
    const invidiousInstances = [
        'https://vid.puffyan.us',
        'https://inv.tux.pizza',
        'https://invidious.fdn.fr'
    ];

    // Əvvəlcə Piped serverlərini yoxlayırıq
    for (let instance of pipedInstances) {
        try {
            console.log(`>>> [PIPED YOXLANILIR]: ${instance}`);
            const response = await fetch(`${instance}/streams/${videoId}`);
            if (response.ok) {
                const data = await response.json();
                const audio = data.audioStreams.find(a => a.mimeType.startsWith('audio/webm')) 
                           || data.audioStreams.find(a => a.mimeType.startsWith('audio/'));
                if (audio && audio.url) {
                    streamUrl = audio.url;
                    mimeType = audio.mimeType;
                    console.log(`>>> [UĞURLU]: ${instance}`);
                    break;
                }
            } else {
                console.log(`>>> [RƏDD EDİLDİ]: ${instance} - Status code: ${response.status}`);
            }
        } catch (e) {
            console.log(`>>> [XƏTA]: ${instance} şəbəkə cavab vermədi.`);
        }
    }

    // Əgər Piped tapmadılsa, Invidious serverlərini yoxlayırıq
    if (!streamUrl) {
        for (let instance of invidiousInstances) {
            try {
                console.log(`>>> [INVIDIOUS YOXLANILIR]: ${instance}`);
                const response = await fetch(`${instance}/api/v1/videos/${videoId}`);
                if (response.ok) {
                    const data = await response.json();
                    const audio = data.adaptiveFormats.find(a => a.type.startsWith('audio/webm')) 
                               || data.adaptiveFormats.find(a => a.type.startsWith('audio/'));
                    if (audio && audio.url) {
                        streamUrl = audio.url;
                        mimeType = audio.type;
                        console.log(`>>> [UĞURLU]: ${instance}`);
                        break;
                    }
                } else {
                    console.log(`>>> [RƏDD EDİLDİ]: ${instance} - Status code: ${response.status}`);
                }
            } catch (e) {
                console.log(`>>> [XƏTA]: ${instance} şəbəkə cavab vermədi.`);
            }
        }
    }

    if (!streamUrl) {
        return res.status(500).send('Heç bir API serveri cavab vermir. Zəhmət olmasa, bir neçə dəqiqə sonra təkrar cəhd edin.');
    }

    try {
        console.log(`>>> [AXIN BAŞLAYIR]: ${mimeType}`);
        
        // Tapılan işlək linkdən səsi birbaşa ön tərəfə ötürürük
        https.get(streamUrl, (stream) => {
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            stream.pipe(res);
        }).on('error', (err) => {
            console.error('>>> [AXIN XƏTASI]:', err.message);
            if (!res.headersSent) res.status(500).send('Səs oxunarkən xəta baş verdi.');
        });

    } catch (err) {
        console.error('>>> [SERVER XƏTASI]:', err.message);
        if (!res.headersSent) res.status(500).send('Server xətası baş verdi.');
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});