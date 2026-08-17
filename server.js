const express = require('express');
const cors = require('cors');
const path = require('path');
const { Readable } = require('stream'); // Yaddaşın dolmaması üçün axın modulu

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => console.error('>>> [XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [XƏTA]:', reason));

// Linkin içindən təmiz ID-ni çıxarmaq üçün funksiya
function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  const videoId = extractVideoId(rawURL);
  if (!videoId) return res.status(400).send('Düzgün YouTube linki daxil edin.');

  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`>>> [YÜKLƏNİR]: ${cleanUrl}`);

  try {
    // 1. YouTube IP blokundan yan keçmək üçün Cobalt API-yə müraciət
    const response = await fetch('https://api.cobalt.tools/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify({
        url: cleanUrl,
        isAudioOnly: true,
        aFormat: 'mp3'
      })
    });

    const data = await response.json();

    if (data && data.url) {
      // 2. Cobalt-dan gələn təmiz audio faylını çəkirik
      const audioStream = await fetch(data.url);
      if (!audioStream.ok) throw new Error('Audio faylı alına bilmədi.');

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="track.mp3"');

      // 3. Serverin RAM-ı dolmasın deyə səsi birbaşa axınla (pipe) Brauzerə göndəririk
      if (audioStream.body) {
         Readable.fromWeb(audioStream.body).pipe(res);
      } else {
         const arrayBuffer = await audioStream.arrayBuffer();
         res.send(Buffer.from(arrayBuffer));
      }
      
    } else {
      console.error('>>> [Cobalt Xətası]:', data);
      return res.status(500).send('Mahnı emal edilə bilmədi.');
    }
  } catch (err) {
    console.error('>>> [Server Yükləmə Xətası]:', err.message);
    return res.status(500).send('Server xətası baş verdi.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});