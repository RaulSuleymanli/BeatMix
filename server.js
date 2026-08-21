const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('ytdl-core');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  
  if (!ytdl.validateURL(rawURL)) {
    return res.status(400).send('Düzgün YouTube linki daxil edin.');
  }

  try {
    console.log(`>>> [YÜKLƏNİR]: ${rawURL}`);

    // Səs axınını alırıq (yüksək keyfiyyətli audio)
    const stream = ytdl(rawURL, {
      filter: 'audioonly',
      quality: 'highestaudio'
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Səsi birbaşa brauzerə axıdırıq
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('>>> [AXIN XƏTASI]:', err.message);
      if (!res.headersSent) res.status(500).send('Səs axını zamanı xəta.');
    });

  } catch (err) {
    console.error('>>> [SERVER XƏTASI]:', err.message);
    if (!res.headersSent) res.status(500).send('Server xətası.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`SERVER HAZIRDIR: Port ${PORT}`);
});