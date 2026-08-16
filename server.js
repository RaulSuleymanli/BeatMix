const express = require('express');
const cors = require('cors');
const path = require('path');
const youtubeDl = require('youtube-dl-exec');

const app = express();

// Bütün saytlardan (Netlify daxil) gələn sorğulara icazə veririk
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Qoruyucu: Serverin çökməsinin qarşısını alır
process.on('uncaughtException', (err) => {
  console.error('>>> [GÖZLƏNİLMƏZ XƏTA - SERVER ÇÖKMƏDİ]:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('>>> [İDARƏ OLUNMAYAN XƏTA - SERVER ÇÖKMƏDİ]:', reason);
});

// Link təmizləyici
function cleanUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/watch?v=${parsed.pathname.slice(1)}`;
    }
    const videoId = parsed.searchParams.get('v');
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
  } catch {
    return url;
  }
}

app.get('/download', (req, res) => {
  const rawURL = req.query.url;

  if (!rawURL) {
    return res.status(400).send('Link daxil edilməyib.');
  }

  const videoURL = cleanUrl(rawURL);
  console.log(`\n-----------------------------------------`);
  console.log(`>>> [YÜKLƏNİR]: ${videoURL}`);

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', 'attachment; filename="track.mp3"');

  // "bestaudio/best" yazaraq mobil cihaz formatlarına tam uyğunlaşdırırıq:
  const subprocess = youtubeDl.exec(videoURL, {
    output: '-',
    format: 'bestaudio/best',
    noWarnings: true,
    noCheckCertificate: true,
    extractorArgs: 'youtube:player_client=ios,android,web'
  });

  subprocess.stdout.pipe(res);

  // İstifadəçi əlaqəni kəsərsə (səhifəni bağlar/yeniləyərsə), yt-dlp prosesini dayandır
  req.on('close', () => {
    if (!res.writableEnded) {
      console.log('>>> [XƏBƏRDARLIQ]: İstifadəçi əlaqəni kəsdi, proses dayandırılır...');
      subprocess.kill('SIGKILL');
    }
  });

  // Çıxış axınında yarana biləcək xətaların serveri çökdürməsinin qarşısını al
  subprocess.stdout.on('error', (err) => {
    console.error('>>> [STDOUT XƏTASI]:', err.message);
  });

  subprocess.on('close', (code) => {
    if (code === 0 || code === null) {
      console.log('>>> [UĞURLU]: Audio fayl WaveSurfer-ə tam yükləndi! 🎧');
    } else {
      console.log(`>>> [XƏTA]: Proses dayandı (kod: ${code})`);
      if (!res.headersSent) {
        res.status(500).send('Yükləmə xətası.');
      }
    }
  });

  subprocess.on('error', (err) => {
    console.error('>>> [SUBPROCESS XƏTASI]:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Xəta: ' + err.message);
    }
  });
});

// ƏSAS DƏYİŞİKLİK BURADADIR: Canlı serverin portunu dinləmək üçün process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(` SERVER HAZIRDIR: Port ${PORT}`);
  console.log(`=========================================\n`);
});