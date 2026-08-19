const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('@distube/ytdl-core'); // Yeni və daha stabil kitabxanamız

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => console.error('>>> [XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [XƏTA]:', reason));

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  
  if (!rawURL) {
      return res.status(400).send('Link daxil edilməyib.');
  }

  try {
    // Linkin həqiqətən YouTube linki olub-olmadığını yoxlayır
    if (!ytdl.validateURL(rawURL)) {
      return res.status(400).send('Düzgün YouTube linki daxil edin.');
    }

    console.log(`>>> [YÜKLƏNİR]: ${rawURL}`);

    // Brauzerə səs faylı göndərdiyimizi bildiririk
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="track.mp3"');

    // Mahnını birbaşa YouTube-dan çəkib axınla (pipe) frontend-ə göndəririk
    ytdl(rawURL, {
      quality: 'highestaudio',
      filter: 'audioonly'
    }).on('error', (err) => {
      console.error('>>> [YTDL Xətası]:', err.message);
      if (!res.headersSent) res.status(500).send('Mahnı emal edilə bilmədi.');
    }).pipe(res);

  } catch (err) {
    console.error('>>> [Server Yükləmə Xətası]:', err.message);
    if (!res.headersSent) res.status(500).send('Server xətası baş verdi.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});