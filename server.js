const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => console.error('>>> [XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [XƏTA]:', reason));

function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// 3 fərqli güclü API ilə audio linkini əldə edən funksiya
async function getAudioDirectUrl(videoId) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. MƏNBƏ: Cobalt API (Ən sürətli və stabil)
  const cobaltInstances = [
    'https://api.cobalt.tools',
    'https://cobalt-api.kwiatek.xyz'
  ];

  for (const instance of cobaltInstances) {
    try {
      console.log(`>>> [Cobalt sınaq]: ${instance}`);
      const res = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: youtubeUrl,
          downloadMode: 'audio',
          audioFormat: 'mp3'
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          console.log(`>>> [Cobalt UĞURLU API TAPIQ]`);
          return data.url;
        }
      }
    } catch (e) {
      console.log(`>>> [Cobalt Xətası]: ${e.message}`);
    }
  }

  // 2. MƏNBƏ: Piped API
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.privacydev.net',
    'https://pipedapi.mha.fi'
  ];

  for (const instance of pipedInstances) {
    try {
      console.log(`>>> [Piped sınaq]: ${instance}`);
      const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.audioStreams && data.audioStreams.length > 0) {
          const audioStream = data.audioStreams[data.audioStreams.length - 1];
          console.log(`>>> [Piped UĞURLU API TAPIQ]`);
          return audioStream.url;
        }
      }
    } catch (e) {
      console.log(`>>> [Piped Xətası]: ${e.message}`);
    }
  }

  // 3. MƏNBƏ: Invidious JSON API
  const invidiousInstances = [
    'https://inv.tux.pizza',
    'https://invidious.nerdvpn.de',
    'https://invidious.drgns.space'
  ];

  for (const instance of invidiousInstances) {
    try {
      console.log(`>>> [Invidious API sınaq]: ${instance}`);
      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        const adaptive = data.adaptiveFormats || [];
        const audioFormats = adaptive.filter(f => f.type && f.type.includes('audio'));
        if (audioFormats.length > 0) {
          console.log(`>>> [Invidious UĞURLU API TAPIQ]`);
          return audioFormats[0].url;
        }
      }
    } catch (e) {
      console.log(`>>> [Invidious Xətası]: ${e.message}`);
    }
  }

  return null;
}

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  const videoId = extractVideoId(rawURL);
  if (!videoId) return res.status(400).send('Düzgün YouTube linki daxil edin.');

  console.log(`>>> [YÜKLƏNİR]: Video ID - ${videoId}`);

  const tempFilePath = path.join(os.tmpdir(), `${videoId}.mp3`);

  // 1. KEŞ YOXLANILMASI VƏ XƏTALI FAYL TƏMİZLƏNMƏSİ
  if (fs.existsSync(tempFilePath)) {
    const stats = fs.statSync(tempFilePath);
    // Əgər fayl 50KB-dan kiçikdirsə (yəni xəta mətni/HTML yazılıbsa), silirik
    if (stats.size > 50000) {
      console.log(`>>> [KEŞDƏN OXUNUR VƏ GÖNDƏRİLİR]: ${videoId} (${stats.size} bytes)`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.sendFile(tempFilePath);
    } else {
      console.log(`>>> [XƏTALI KÖHNƏ FAYL SİLİNDİ]: ${videoId}`);
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
  }

  // 2. CANLI AUDİO LİNKİNİN TAPA BİLMƏSİ
  const directAudioUrl = await getAudioDirectUrl(videoId);

  if (!directAudioUrl) {
    return res.status(500).send('Mahnı mənbələrindən heç biri ilə əlaqə saxlanıla bilmədi.');
  }

  // 3. FAYLIN SERVERƏ YÜKLƏNİB HAZIRLANMASI
  try {
    console.log(`>>> [SƏS AXINI YÜKLƏNİR VƏ YAZILIR]...`);
    const audioRes = await fetch(directAudioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!audioRes.ok) {
      throw new Error(`Səs faylı yüklənə bilmədi, HTTP Status: ${audioRes.status}`);
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Əgər yüklənən şey fayl yox, kiçik bir HTML xəta mətni olarsa (50KB-dan az)
    if (buffer.length < 50000) {
      throw new Error('Yüklənən fayl audio deyil (və ya zədələnib).');
    }

    fs.writeFileSync(tempFilePath, buffer);
    console.log(`>>> [FAYL MÜVƏFFƏQİYYƏTLƏ YAZILDI]: ${tempFilePath} (${buffer.length} bytes)`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(tempFilePath);

  } catch (err) {
    console.error('>>> [Ötürmə Xətası]:', err.message);
    if (fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    if (!res.headersSent) res.status(500).send('Audio göndərilərkən xəta baş verdi.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});