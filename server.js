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

  // Linkdəki xətalı simvolların (\, c) qarşısını almaq üçün təmizlik
  rawURL = rawURL.trim().replace(/\\+$/, '').replace(/c$/, '');

  console.log(`>>> [YÜKLƏNİR]: ${rawURL}`);

  // WaveSurfer-in dalğanı oxuya bilməsi üçün düzgün başlıqlar
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    console.log(`>>> [SƏS AXINI BAŞLADI - yt-dlp]`);
    
    // YouTube-un "bot" blokadasını keçən əsas alət
    const subprocess = youtubedl.exec(rawURL, {
      output: '-',          // Səsi heç yerə yaddaş etmədən birbaşa çıxışa yönləndirir
      format: 'bestaudio',  // Ən yaxşı səs keyfiyyətini seçir
      quiet: true,          // Konsol yazılarını səs faylına qarışdırmır (xətanın qarşısını alır)
      noWarnings: true,
      noCheckCertificates: true
    }, { 
      // Səsi birbaşa göndəririk (pipe), xətaları isə Render loglarına yazdırırıq
      stdio: ['ignore', 'pipe', 'inherit'] 
    });

    // Səs faylı gəldikcə birbaşa ön üzə (WaveSurfer-ə) axın edilir
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