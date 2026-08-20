const express = require('express');
const cors = require('cors');
const path = require('path');
const { Readable } = require('stream');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => console.error('>>> [XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [XƏTA]:', reason));

function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// İnternetdə açıq və token istəməyən Cobalt serverlərinin siyahısı
const COBALT_APIS = [
  'https://co.e-z.host',
  'https://cobalt.owo.vc',
  'https://cobalt.qoid.co',
  'https://api.cobalt.tools' 
];

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  const videoId = extractVideoId(rawURL);
  if (!videoId) return res.status(400).send('Düzgün YouTube linki daxil edin.');

  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`>>> [YÜKLƏNİR]: ${cleanUrl}`);

  let downloadUrl = null;

  // İşləyən serveri tapana qədər bir-bir yoxlayırıq
  for (const api of COBALT_APIS) {
    console.log(`>>> [Yoxlanılır]: ${api}`);
    try {
      const response = await fetch(api, {
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
        downloadUrl = data.url;
        console.log(`>>> [UĞURLU TAPIQ]: ${api}`);
        break; // İşləyən server tapan kimi dövrəni dayandırırıq
      }
    } catch (err) {
      console.log(`>>> [Server İşləmədi, digərinə keçilir]: ${api}`);
      continue; 
    }
  }

  if (!downloadUrl) {
     console.error('>>> [BÜTÜN SERVERLƏR UĞURSUZ OLDU]');
     return res.status(500).send('Mahnı heç bir serverdən emal edilə bilmədi. Biraz sonra yenidən yoxlayın.');
  }

  try {
    const audioStream = await fetch(downloadUrl);
    if (!audioStream.ok) throw new Error('Audio faylı alına bilmədi.');

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="track.mp3"');

    // Səsi birbaşa səhifəyə ötürürük
    if (audioStream.body) {
       Readable.fromWeb(audioStream.body).pipe(res);
    } else {
       const arrayBuffer = await audioStream.arrayBuffer();
       res.send(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    console.error('>>> [Axın Xətası]:', err.message);
    return res.status(500).send('Audio göndərilərkən xəta baş verdi.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});