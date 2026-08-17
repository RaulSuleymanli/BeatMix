const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => console.error('>>> [XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [XƏTA]:', reason));

// YouTube Linkini və ID-sini təmizləyən funksiya
function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  const videoId = extractVideoId(rawURL);
  if (!videoId) {
    return res.status(400).send('Düzgün YouTube linki daxil edin.');
  }

  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`>>> [YÜKLƏNİR]: ${cleanUrl}`);

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', 'attachment; filename="track.mp3"');

  // Metod 1: ytdl-core ilə sınaq
  try {
    const stream = ytdl(cleanUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    });

    let hasError = false;
    stream.on('error', async (err) => {
      if (hasError) return;
      hasError = true;
      console.log('>>> ytdl bloklandı, Ehtiyat Serverə (Cobalt API) keçid edilir...');
      await fetchViaCobalt(cleanUrl, res);
    });

    stream.pipe(res);
  } catch (err) {
    console.log('>>> ytdl xətası, Ehtiyat Serverə keçid edilir...');
    await fetchViaCobalt(cleanUrl, res);
  }
});

// Metod 2: Ehtiyat Yükləmə Mexanizmi (YouTube Cloud IP Blokunu Keçmək Üçün)
async function fetchViaCobalt(cleanUrl, res) {
  try {
    const cobaltRes = await fetch('https://api.cobalt.tools/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: cleanUrl,
        downloadMode: 'audio',
        audioFormat: 'mp3'
      })
    });

    const data = await cobaltRes.json();
    if (data && data.url) {
      const audioStream = await fetch(data.url);
      const arrayBuffer = await audioStream.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } else {
      if (!res.headersSent) res.status(500).send('Mahnı yüklənə bilmədi.');
    }
  } catch (e) {
    console.error('>>> Cobalt Ehtiyat Xətası:', e.message);
    if (!res.headersSent) res.status(500).send('Server xətası.');
  }
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});