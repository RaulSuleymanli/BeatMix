const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

// YouTube linkindən qısa Video ID-ni tapan funksiya
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

    let data = null;
    
    // IP blokundan qorunmaq üçün 3 fərqli public Piped API instansından (proxy) istifadə edirik
    const instances = [
        'https://pipedapi.kavin.rocks',
        'https://api.piped.projectsegfau.lt',
        'https://pipedapi.tokhmi.xyz'
    ];

    // Hansı API serveri işləyirsə, ondan məlumatı çəkirik
    for (let instance of instances) {
        try {
            console.log(`>>> [API YOXLANILIR]: ${instance}`);
            const response = await fetch(`${instance}/streams/${videoId}`);
            if (response.ok) {
                data = await response.json();
                break; // İşləyən server tapan kimi dövrü dayandırır
            }
        } catch (e) {
            console.log(`>>> [API XƏTASI]: ${instance} cavab vermədi.`);
        }
    }

    if (!data) {
        return res.status(500).send('Heç bir proxy API cavab vermir. Bir az sonra yenidən yoxlayın.');
    }

    try {
        // Gələn məlumatdan ən uyğun səs (audio) axınını tapırıq
        const audioStream = data.audioStreams.find(a => a.mimeType.startsWith('audio/webm')) 
                         || data.audioStreams.find(a => a.mimeType.startsWith('audio/'));
                         
        if (!audioStream || !audioStream.url) throw new Error('Səs axını tapılmadı.');

        console.log(`>>> [AXIN TAPILDI]: ${audioStream.mimeType}`);
        
        // Piped-in verdiyi təmiz səs axınını tutub birbaşa frontend-ə yönləndiririk
        https.get(audioStream.url, (stream) => {
            res.setHeader('Content-Type', audioStream.mimeType || 'audio/webm');
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