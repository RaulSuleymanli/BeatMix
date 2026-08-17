const express = require('express');
const cors = require('cors');
const path = require('path');
const youtubeDl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Linki təmizləmək üçün funksiya
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

// Musiqi yükləmə (Download) bölməsi
app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  const videoURL = cleanUrl(rawURL);
  console.log(`\n>>> [YÜKLƏNİR]: ${videoURL}`);

  try {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="track.mp3"');

    const subprocess = youtubeDl.exec(videoURL, {
      output: '-',
      format: 'bestaudio',
      audioFormat: 'mp3',
      ffmpegLocation: ffmpegPath // ffmpeg-i birbaşa qovluqdan oxuyur
    });

    subprocess.stdout.pipe(res);

    subprocess.on('close', (code) => {
      console.log(`>>> Proses bitdi. (Kod: ${code})`);
    });

  } catch (err) {
    console.error('>>> [XƏTA]:', err.message);
    if (!res.headersSent) res.status(500).send('Server xətası.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});