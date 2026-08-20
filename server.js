const express = require('express');
const cors = require('cors');
const path = require('path');
const play = require('play-dl'); // Discord botlarının istifadə etdiyi paket

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => console.error('>>> [XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [XƏTA]:', reason));

app.get('/download', async (req, res) => {
  const rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  console.log(`>>> [YÜKLƏNİR]: ${rawURL}`);

  try {
    // Səsi birbaşa YouTube-dan axınla (stream) alırıq
    const stream = await play.stream(rawURL);
    
    // Brauzerə gələn formatı avtomatik tanıdırıq
    res.setHeader('Content-Type', stream.type); 
    res.setHeader('Content-Disposition', 'attachment; filename="track.mp3"');
    
    // Səsi kəsilmədən ön tərəfə ötürürük
    stream.stream.pipe(res);
    
  } catch (err) {
    console.error('>>> [Play-DL Xətası]:', err.message);
    if (!res.headersSent) res.status(500).send('Mahnı yüklənə bilmədi.');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================`);
});