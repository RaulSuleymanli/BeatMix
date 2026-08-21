const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

// YouTube IP bloklamasını aşmaq üçün agent yaradırıq
const agent = ytdl.createAgent();

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  
  if (!ytdl.validateURL(rawURL)) {
    return res.status(400).send('Düzgün YouTube linki daxil edin.');
  }

  try {
    console.log(`>>> [YÜKLƏNİR]: ${rawURL}`);

    const stream = ytdl(rawURL, {
      filter: 'audioonly',
      quality: 'highestaudio',
      agent: agent,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');

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