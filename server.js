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
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://inv.us.projectsegfau.lt',
  'https://invidious.drgns.space',
  'https://invidious.privacydev.net',
  'https://invidious.io.lol'
];

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  const videoId = extractVideoId(rawURL);
  if (!videoId) return res.status(400).send('Düzgün YouTube linki daxil edin.');

  console.log(`>>> [YÜKLƏNİR]: Video ID - ${videoId}`);

  let audioStreamResponse = null;

  for (const instance of INVIDIOUS_INSTANCES) {
    console.log(`>>> [Sınaq olunur Invidious]: ${instance}`);
    try {
      const streamUrl = `${instance}/latest_version?id=${videoId}&italic=true&listen=true`;

      const mediaRes = await fetch(streamUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (mediaRes.ok && mediaRes.body) {
        audioStreamResponse = mediaRes;
        console.log(`>>> [UĞURLU TAPIQ]: ${instance}`);
        break;
      }
    } catch (err) {
      console.log(`>>> [İnstance Xətası]: ${instance} - ${err.message}`);
      continue;
    }
  }

  if (!audioStreamResponse) {
    console.error('>>> [BÜTÜN INVIDIOUS SERVERLƏRİ UĞURSUZ OLDU]');
    return res.status(500).send('Mahnı emal edilə bilmədi.');
  }

  try {
    // Səs faylının serverdən gələn Orijinal tipini çəkirik (Brauzerin rahat oxuması üçün)
    const realContentType = audioStreamResponse.headers.get('content-type') || 'audio/mpeg';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', realContentType);

    if (audioStreamResponse.body) {
      Readable.fromWeb(audioStreamResponse.body).pipe(res);
    } else {
      const arrayBuffer = await audioStreamResponse.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    console.error('>>> [Ötürmə Xətası]:', err.message);
    if (!res.headersSent) res.status(500).send('Audio göndərilərkən xəta baş verdi.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});