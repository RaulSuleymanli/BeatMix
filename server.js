const express = require('express');
const cors = require('cors');
const path = require('path');
const play = require('play-dl');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  
  if (!rawURL) {
    return res.status(400).send('YouTube linki daxil edilməyib.');
  }

  try {
    console.log(`>>> [YÜKLƏNİR]: ${rawURL}`);

    // play-dl YouTube bot qorumasından yayınaraq səsi çəkir
    const streamInfo = await play.stream(rawURL);

    // Düzgün səs formatını təyin edirik
    res.setHeader('Content-Type', streamInfo.type === 'opus' ? 'audio/ogg' : 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Səsi frontendə göndəririk
    streamInfo.stream.pipe(res);

  } catch (err) {
    console.error('>>> [SERVER XƏTASI]:', err.message);
    if (!res.headersSent) res.status(500).send('Server xətası və ya YouTube bloku.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});