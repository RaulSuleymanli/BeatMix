const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const dns = require('dns');

// RENDER SERVERİNDƏKİ ŞƏBƏKƏ (FETCH FAILED) XƏTASINI HƏLL EDƏN ƏSAS KOD:
dns.setDefaultResultOrder('ipv4first');

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
  // 1. Cobalt API
  const cobaltInstances = [
    'https://api.cobalt.tools',
    'https://co.wuk.sh'
  ];

  for (const instance of cobaltInstances) {
    try {
      console.log(`>>> [Cobalt Sorğusu]: ${instance}`);
      const res = await axios.post(`${instance}/`, {
        url: fullUrl,
        downloadMode: 'audio',
        audioFormat: 'mp3'
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000 
      });

      if (res.data && res.data.url) {
        console.log(`>>> [Cobalt Uğurlu]`);
        return res.data.url;
      }
    } catch (err) {
      console.log(`>>> [Cobalt Xətası - ${instance}]:`, err.message);
    }
  }

  // 2. Piped API
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.privacydev.net',
    'https://pipedapi.mha.fi'
  ];

  for (const instance of pipedInstances) {
    try {
      console.log(`>>> [Piped Sorğusu]: ${instance}`);
      const res = await axios.get(`${instance}/streams/${videoId}`, { timeout: 10000 });
      
      if (res.data && res.data.audioStreams && res.data.audioStreams.length > 0) {
        const bestAudio = res.data.audioStreams[res.data.audioStreams.length - 1];
        console.log(`>>> [Piped Uğurlu]`);
        return bestAudio.url;
      }
    } catch (err) {
      console.log(`>>> [Piped Xətası - ${instance}]:`, err.message);
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
      console.error('>>> [XƏTA]: Bütün mənbələr əlçatmazdır.');
      return res.status(500).send('Səs mənbəyi tapılmadı.');
    }

    console.log(`>>> [SƏS AXINI BAŞLAYIR]...`);
    
    // Axios ilə birbaşa səs axınını yaradırıq
    const mediaRes = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Səsi ön üzə axıdırıq
    mediaRes.data.pipe(res);

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