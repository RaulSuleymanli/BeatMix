const express = require('express');
const cors = require('cors');
const path = require('path');
const youtubedl = require('youtube-dl-exec');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname)));

process.on('uncaughtException', (err) => console.error('>>> [KRİTİK XƏTA]:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [KRİTİK XƏTA]:', reason));

app.get('/download', (req, res) => {
  let rawURL = req.query.url;
  if (!rawURL) return res.status(400).send('Link daxil edilməyib.');

  // Linkdəki xətalı simvolların qarşısını almaq üçün təmizlik
  rawURL = rawURL.trim().replace(/\\+$/, '').replace(/c$/, '');

  console.log(`>>> [YÜKLƏNİR]: ${rawURL}`);

  // WaveSurfer-in dalğanı oxuya bilməsi üçün mütləq başlıqlar
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    console.log(`>>> [SƏS AXINI BAŞLADI - Android Bypass ilə]`);
    
    const subprocess = youtubedl.exec(rawURL, {
      output: '-',
      format: 'bestaudio',
      quiet: true,
      noWarnings: true,
      noCheckCertificates: true,
      // BURA ƏLAVƏ EDİLDİ: YouTube-u aldadıb sorğunu Android telefondan gəlirmiş kimi göstəririk
      extractorArgs: 'youtube:player_client=android',
      // Render-in tez-tez bloklanan IPv6 ünvanından yan keçmək üçün
      forceIpv4: true,
      // Əvvəlki yarımçıq xətalı yaddaşı silmək üçün
      rmCacheDir: true
    }, { 
      stdio: ['ignore', 'pipe', 'inherit'] 
    });

    // Mahnı gəldikcə dərhal ön üzə (WaveSurfer-ə) axın edilir
    subprocess.stdout.pipe(res);

    subprocess.on('close', (code) => {
      if (code !== 0) {
         console.log(`>>> [PROSES DAYANDI]: Xəta kodu ${code}`);
      }
    });

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