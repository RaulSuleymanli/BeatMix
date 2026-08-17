const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Faylları silmək üçün əlavə etdik
const youtubeDl = require('youtube-dl-exec');
const ffmpegPath = require('ffmpeg-static');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

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

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  const videoURL = cleanUrl(rawURL);
  console.log(`\n>>> [YÜKLƏNİR]: ${videoURL}`);

  // Faylı müvəqqəti yadda saxlamaq üçün unikal ad (məsələn: audio-1692345.mp3) yaradırıq
  const tempFileName = `audio-${Date.now()}.mp3`;
  const tempFilePath = path.join(__dirname, tempFileName);

  try {
    // 1. Mahnını serverin yaddaşına tam hazır vəziyyətdə yükləyirik
    await youtubeDl(videoURL, {
      output: tempFilePath,
      extractAudio: true,
      audioFormat: 'mp3',
      ffmpegLocation: ffmpegPath
    });

    console.log(`>>> Mahnı serverə tam yükləndi, ön üzə (WaveSurfer-ə) göndərilir...`);

    // 2. Tam hazır faylı istifadəçiyə göndəririk (WaveSurfer ancaq bu halda dalğa çəkir!)
    res.download(tempFilePath, 'track.mp3', (err) => {
      if (err) {
        console.error('>>> [GÖNDƏRMƏ XƏTASI]:', err.message);
      }
      // 3. İstifadəçiyə göndəriləndən dərhal sonra faylı serverdən silirik
      fs.unlink(tempFilePath, (unlinkErr) => {
        if (unlinkErr) console.error("Faylı silərkən xəta:", unlinkErr);
      });
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