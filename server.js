const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const ytdlp = require('yt-dlp-exec');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

app.get('/download', async (req, res) => {
    const rawURL = req.query.url;
    if (!rawURL) return res.status(400).send('YouTube linki daxil edilməyib.');

    console.log(`>>> [YÜKLƏNİR (yt-dlp)]: ${rawURL}`);

    try {
        // yt-dlp vasitəsilə birbaşa audio axın linkini çəkirik
        const output = await ytdlp(rawURL, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            format: 'bestaudio',
        });

        const audioUrl = output.url;
        if (!audioUrl) throw new Error('Audio linki tapılmadı.');

        console.log(`>>> [AXIN URL-İ TAPANILDI]: Uğurludur`);

        // Tapılan linki frontend-ə ötürürük
        https.get(audioUrl, (stream) => {
            res.setHeader('Content-Type', 'audio/webm');
            res.setHeader('Access-Control-Allow-Origin', '*');
            stream.pipe(res);
        }).on('error', (err) => {
            console.error('>>> [AXIN XƏTASI]:', err.message);
            if (!res.headersSent) res.status(500).send('Səs oxunarkən xəta baş verdi.');
        });

    } catch (err) {
        console.error('>>> [YT-DLP XƏTASI]:', err.message);
        if (!res.headersSent) res.status(500).send('YouTube axını alınarkən xəta baş verdi.');
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});