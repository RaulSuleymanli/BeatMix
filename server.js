const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Serverin çökməsinin qarşısını alan qoruyucular
process.on('uncaughtException', (err) => console.error('>>> [XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [XƏTA]:', reason));

app.get('/download', (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  console.log(`>>> [YÜKLƏNİR]: ${rawURL}`);

  try {
    // Brauzerə MP3 faylı göndərdiyimizi bildiririk
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="track.mp3"');

    // Əlavə proqramlar olmadan təmiz JS ilə audionu çəkirik
    const stream = ytdl(rawURL, { 
        filter: 'audioonly',
        quality: 'highestaudio'
    });

    stream.on('error', (err) => {
        console.error('>>> [YÜKLƏMƏ XƏTASI]:', err.message);
        if (!res.headersSent) res.status(500).send('Yükləmə xətası.');
    });

    // Səsi birbaşa frontend-ə yönləndiririk
    stream.pipe(res);

  } catch (err) {
    console.error('>>> [SERVER XƏTASI]:', err.message);
    if (!res.headersSent) res.status(500).send('Server xətası.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});