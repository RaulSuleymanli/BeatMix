const express = require('express');
const cors = require('cors');
const path = require('path');
const youtubeDl = require('youtube-dl-exec');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

// QORUYUCU: Serverdə xəta yarandıqda serverin çökməsinin qarşısını alır
process.on('uncaughtException', (err) => {
  console.error('>>> [XƏTA TUTULDU - SERVER ÇÖKMƏDİ]:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('>>> [XƏTA TUTULDU - SERVER ÇÖKMƏDİ]:', reason);
});

function cleanUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/watch?v=${parsed.pathname.slice(1)}`;
    }
    const videoId = parsed.searchParams.get('v');
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
  } catch {
    return url;
  }
}

app.get('/download', (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  const videoURL = cleanUrl(rawURL);
  console.log(`>>> [YÜKLƏNİR]: ${videoURL}`);

  try {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="track.mp3"');

    const subprocess = youtubeDl.exec(videoURL, {
      output: '-',
      format: 'bestaudio/best',
      noCheckCertificate: true,
      noWarnings: true
    });

    subprocess.stdout.pipe(res);

    subprocess.on('error', (err) => {
      console.error('>>> [SUBPROCESS XƏTASI]:', err.message);
      if (!res.headersSent) res.status(500).send('Yükləmə xətası.');
    });

    req.on('close', () => {
      if (!res.writableEnded) {
        subprocess.kill('SIGKILL');
      }
    });
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