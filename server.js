const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => console.error('>>> [KRİTİK XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [KRİTİK XƏTA]:', reason));

app.get('/download', async (req, res) => {
  let rawURL = req.query.url;
  
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  // `image_cf540a.png` şəklindəki link sonuna düşən artıq \ simvollarını təmizləyirik
  rawURL = rawURL.trim().replace(/\\+$/, '').replace(/c$/, '');

  if (!ytdl.validateURL(rawURL)) {
    return res.status(400).send('Düzgün YouTube linki daxil edin.');
  }

  console.log(`>>> [YÜKLƏNİR]: ${rawURL}`);

  try {
    // WaveSurfer-in səsi dərhal oxuya bilməsi üçün icazələr
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // YouTube-dan birbaşa səs axını alırıq (heç bir kənar sayt olmadan)
    const stream = ytdl(rawURL, {
      quality: 'highestaudio',
      filter: 'audioonly',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    });

    stream.on('info', (info) => {
      console.log(`>>> [MAHNI TAPILDI]: ${info.videoDetails.title}`);
    });

    stream.on('error', (err) => {
      console.error('>>> [SƏS AXINI XƏTASI]:', err.message);
      if (!res.headersSent) {
        res.status(500).send('YouTube səsi çəkməyə icazə vermədi.');
      }
    });

    // Mahnını serverin yaddaşına yazmağa vaxt itirmədən, canlı olaraq ön üzə (brauzerə) ötürürük. (Sürətli dalğa üçün!)
    stream.pipe(res);

  } catch (err) {
    console.error('>>> [SERVER XƏTASI]:', err.message);
    if (!res.headersSent) res.status(500).send('Daxili xəta baş verdi.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});