const express = require('express');
const cors = require('cors');
const path = require('path');
const { Readable } = require('stream');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => console.error('>>> [XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [XƏTA]:', reason));

function extractVideoId(url) {
  if (!url) return null;
  const cleanUrl = url.trim().replace(/\\+$/, '').replace(/c$/, '');
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = cleanUrl.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function getAudioStreamUrl(videoId, fullUrl) {
  // Cobalt API vasitəsilə bloklanmadan səs keçidinin alınması
  const cobaltInstances = [
    'https://api.cobalt.tools',
    'https://co.wuk.sh'
  ];

  for (const instance of cobaltInstances) {
    try {
      console.log(`>>> [Cobalt Sorğusu]: ${instance}`);
      const res = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: fullUrl,
          downloadMode: 'audio',
          audioFormat: 'mp3'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          console.log(`>>> [Cobalt Uğurlu]`);
          return data.url;
        }
      }
    } catch (err) {
      console.log(`>>> [Cobalt Xətası]: ${err.message}`);
    }
  }

  // Ehtiyat mənbə: Piped API
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.privacydev.net',
    'https://pipedapi.mha.fi'
  ];

  for (const instance of pipedInstances) {
    try {
      console.log(`>>> [Piped Sorğusu]: ${instance}`);
      const res = await fetch(`${instance}/streams/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.audioStreams && data.audioStreams.length > 0) {
          const bestAudio = data.audioStreams[data.audioStreams.length - 1];
          console.log(`>>> [Piped Uğurlu]`);
          return bestAudio.url;
        }
      }
    } catch (err) {
      console.log(`>>> [Piped Xətası]: ${err.message}`);
    }
  }

  return null;
}

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  const videoId = extractVideoId(rawURL);
  if (!videoId) return res.status(400).send('Düzgün YouTube linki daxil edin.');

  const cleanFullUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`>>> [YÜKLƏNİR]: Video ID - ${videoId}`);

  try {
    const audioUrl = await getAudioStreamUrl(videoId, cleanFullUrl);

    if (!audioUrl) {
      console.error('>>> [XƏTA]: Səs linki əldə edilə bilmədi.');
      return res.status(500).send('Mahnı mənbəsi tapılmadı.');
    }

    console.log(`>>> [SƏS AXINI BAŞLAYIR]...`);
    const mediaRes = await fetch(audioUrl);

    if (!mediaRes.ok) {
      throw new Error(`Media yüklənmədi, status: ${mediaRes.status}`);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Səs faylını canlı olaraq WaveSurfer-ə axıdırıq
    const nodeStream = Readable.fromWeb(mediaRes.body);
    nodeStream.pipe(res);

  } catch (err) {
    console.error('>>> [SERVER XƏTASI]:', err.message);
    if (!res.headersSent) res.status(500).send('Audio yayımında xəta baş verdi.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});