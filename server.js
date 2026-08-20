const express = require('express');
const cors = require('cors');
const path = require('path');
const { Readable } = require('stream');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => console.error('>>> [XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [XƏTA]:', reason));

// Linkin içindən yalnız ID-ni (məsələn: a6Z8_oaGydU) tapıb çıxarır
function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// YouTube-un bloklarını aşmaq üçün 3 fərqli Piped Proxy serveri
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.syncpundit.io',
  'https://api.piped.projectsegfau.lt'
];

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  const videoId = extractVideoId(rawURL);
  if (!videoId) return res.status(400).send('Düzgün YouTube linki daxil edin.');

  console.log(`>>> [YÜKLƏNİR]: Video ID - ${videoId}`);

  let audioUrl = null;

  // İşləyən proxy serverini tapana qədər bir-bir yoxlayırıq
  for (const api of PIPED_INSTANCES) {
    console.log(`>>> [Yoxlanılır Proxy]: ${api}`);
    try {
      const response = await fetch(`${api}/streams/${videoId}`);
      if (!response.ok) continue; // İşləməsə, digərinə keç
      
      const data = await response.json();
      if (data && data.audioStreams && data.audioStreams.length > 0) {
        // Brauzerlərdə ən yaxşı işləyən audio formatını seçirik
        const bestAudio = data.audioStreams.find(s => s.mimeType.includes('mp4')) || data.audioStreams[0];
        audioUrl = bestAudio.url; // Bu URL YouTube-a yox, Proxy-ə gedir!
        console.log(`>>> [UĞURLU TAPIQ]: ${api}`);
        break; 
      }
    } catch (err) {
      console.log(`>>> [Proxy İşləmədi]: ${api}`);
      continue;
    }
  }

  if (!audioUrl) {
    console.error('>>> [BÜTÜN PROXY SERVERLƏR UĞURSUZ OLDU]');
    return res.status(500).send('Mahnı blokları aşa bilmədi.');
  }

  try {
    // Səsi YouTube-dan deyil, tapdığımız gizli vasitəçidən çəkirik
    const audioStream = await fetch(audioUrl);
    if (!audioStream.ok) throw new Error('Səs faylı proxy-dən alına bilmədi.');

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="track.mp3"');

    // Səsi kəsilmədən axın (pipe) vasitəsilə saytına ötürürük
    if (audioStream.body) {
       Readable.fromWeb(audioStream.body).pipe(res);
    } else {
       const arrayBuffer = await audioStream.arrayBuffer();
       res.send(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    console.error('>>> [Axın Xətası]:', err.message);
    if (!res.headersSent) res.status(500).send('Audio göndərilərkən xəta baş verdi.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});