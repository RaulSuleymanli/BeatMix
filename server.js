const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

app.get('/download', (req, res) => {
    const rawURL = req.query.url;
    if (!rawURL) return res.status(400).send('YouTube linki daxil edilməyib.');

    console.log(`>>> [YÜKLƏNİR (System yt-dlp)]: ${rawURL}`);

    // Birbaşa sistemdə quraşdırılmış yt-dlp vasitəsilə linki alırıq
    exec(`yt-dlp --get-url -f bestaudio "${rawURL}"`, (error, stdout, stderr) => {
        if (error) {
            console.error('>>> [YT-DLP XƏTASI]:', stderr || error.message);
            return res.status(500).send('YouTube axını alınarkən xəta baş verdi.');
        }

        const streamUrl = stdout.trim().split('\n')[0];
        if (!streamUrl) {
            return res.status(500).send('Audio linki tapılmadı.');
        }

        console.log(`>>> [AXIN URL-İ TAPANILDI]`);

        // Tapılan təmiz linki frontend-ə ötürürük
        https.get(streamUrl, (stream) => {
            res.setHeader('Content-Type', 'audio/webm');
            res.setHeader('Access-Control-Allow-Origin', '*');
            stream.pipe(res);
        }).on('error', (err) => {
            console.error('>>> [AXIN XƏTASI]:', err.message);
            if (!res.headersSent) res.status(500).send('Səs oxunarkən xəta baş verdi.');
        });
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});