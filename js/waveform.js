let fullWs1, fullWs2, zoomWs1, zoomWs2;
let regionsPlugin1, regionsPlugin2;

let selectedRegion1 = { start: 0, end: 30, duration: 30 };
let selectedRegion2 = { start: 0, end: 30, duration: 30 };

let offsets = { track1: 0, track2: 0 };
let currentAudioUrls = { track1: null, track2: null };
let decodedAudioBuffers = { track1: null, track2: null };
let slicedAudioBuffers = { track1: null, track2: null };
let activeWavUrls = { track1: null, track2: null };

let isPlaying = false;
let playheadX = 0;
let playheadAnimationId = null;
let mixDurationSeconds = 30;

const EXTRA_WORKSPACE_SEC = 10;

let previewState = { track1: false, track2: false };

let globalTrack1Lines = [];
let globalTrack2Lines = [];

let audioCtx = null;
let gainNode1 = null;
let gainNode2 = null;
let playbackStartTime = 0;

let mixAudio1 = null, mixAudio2 = null;
let mixSourceNode1 = null, mixSourceNode2 = null;
let mixTimeouts = [];

let activeYtTrack = 1;

const CAMELOT_KEYS = ["1A", "2A", "3A", "4A", "5A", "6A", "7A", "8A", "9A", "10A", "11A", "12A", "1B", "2B", "3B", "4B", "5B", "6B"];

// --- 5 DİLLİ XƏTLƏR HAQQINDA MƏLUMAT LÜĞƏTİ ---
const linesInfoTranslations = {
  az: {
    title: "🎛️ Xətlər və İdarəetmə Haqqında",
    cards: [
      {
        type: "yellow",
        icon: "⚡",
        title: "Sarı Xətt (Ani Keçid / Step Cut)",
        desc: "Səsin və ya tezliyin anidən (pilləli) dəyişməsini təmin edir. Mahnını qəfil kəsmək ('Drop' və ya 'Cut' effekti verərək səs səviyyəsini anında aşağı/yuxarı salmaq) üçün ideal xəttdir."
      },
      {
        type: "cyan",
        icon: "🌊",
        title: "Firuzəyi Xətt (Yumşaq Keçid / Linear Fade)",
        desc: "Səsin tədricən artmasını və ya azalmasını (Fade-In / Fade-Out) idarə edir. İki mahnı arasında peşəkar crossfade (birinin yavaşca sönüb digərinin ucalması) yaratmaq üçün istifadə olunur."
      },
      {
        type: "purple",
        icon: "🎚️",
        title: "Bənövşəyi Xətt (Sabit Balans / EQ & Base)",
        desc: "Mahnının əsas fon səviyyəsini və ya tezlik balansını (məsələn, Bas / EQ filtrini) sabit saxlamaq və ya müəyyən aralıqda neytral səviyyədə tutmaq üçün istifadə olunur."
      },
      {
        type: "general",
        icon: "🖱️",
        title: "Necə İdarə Etməli?",
        desc: "Xəttin üzərindəki ağ dairəvi düyünləri (nöqtələri) siçanla tutub şaquli (yuxarı-aşağı səviyyə üçün) və ya üfüqi (zamanı dəyişmək üçün) sərbəst hərəkət etdirə bilərsiniz."
      }
    ]
  },
  en: {
    title: "🎛️ About Automation Lines",
    cards: [
      {
        type: "yellow",
        icon: "⚡",
        title: "Yellow Line (Step Cut / Instant Switch)",
        desc: "Provides instant (stepped) volume or filter changes. Perfect for drops, sudden cuts, or instantly muting/unmuting a track at a precise beat."
      },
      {
        type: "cyan",
        icon: "🌊",
        title: "Cyan Line (Linear Fade / Ramp)",
        desc: "Controls gradual transitions (Fade-In / Fade-Out). Essential for smooth crossfading between two tracks so they blend naturally over time."
      },
      {
        type: "purple",
        icon: "🎚️",
        title: "Purple Line (Base Level / EQ Balance)",
        desc: "Represents the steady background level or frequency filter balance (like Bass/EQ). Keeps the track at a balanced output during steady mix sections."
      },
      {
        type: "general",
        icon: "🖱️",
        title: "How to Use?",
        desc: "Click and drag the white circular nodes on any line vertically to adjust intensity/volume, and horizontally to change their exact timing in the mix."
      }
    ]
  },
  ru: {
    title: "🎛️ О линиях автоматизации",
    cards: [
      {
        type: "yellow",
        icon: "⚡",
        title: "Желтая линия (Резкий срез / Step Cut)",
        desc: "Обеспечивает мгновенное изменение громкости или фильтра. Идеально подходит для эффекта 'Drop', резкого включения или выключения звука трека."
      },
      {
        type: "cyan",
        icon: "🌊",
        title: "Бирюзовая линия (Плавный переход / Linear Fade)",
        desc: "Управляет плавным нарастанием или затуханием звука (Fade-In / Fade-Out). Используется для профессионального кроссфейда между двумя треками."
      },
      {
        type: "purple",
        icon: "🎚️",
        title: "Фиолетовая линия (Базовый уровень / EQ)",
        desc: "Регулирует общий фоновый баланс или фильтры частот (например, Басс/EQ), удерживая трек на стабильном уровне звучания."
      },
      {
        type: "general",
        icon: "🖱️",
        title: "Как управлять?",
        desc: "Зажмите белые круглые точки (узлы) на линиях мышкой и перетаскивайте их вверх-вниз для изменения уровня или влево-вправо для изменения времени."
      }
    ]
  },
  tr: {
    title: "🎛️ Çizgiler ve Kontrol Hakkında",
    cards: [
      {
        type: "yellow",
        icon: "⚡",
        title: "Sarı Çizgi (Ani Geçiş / Step Cut)",
        desc: "Sesin veya frekansın aniden (basamaklı) değişmesini sağlar. Şarkıyı anlık kesmek ('Drop' veya 'Cut' etkisi) ve sesi anında açıp kapatmak için idealdir."
      },
      {
        type: "cyan",
        icon: "🌊",
        title: "Turkuaz Çizgi (Yumuşak Geçiş / Linear Fade)",
        desc: "Sesin kademeli olarak artmasını veya azalmasını (Fade-In / Fade-Out) kontrol eder. İki şarkıyı birbirine kusursuzca bağlamak (crossfade) için kullanılır."
      },
      {
        type: "purple",
        icon: "🎚️",
        title: "Mor Çizgi (Sabit Denge / EQ & Base)",
        desc: "Şarkının ana arka plan seviyesini veya frekans dengesini (örneğin Bas / EQ) sabit tutmak veya belirli bir seviyede sabitlemek için kullanılır."
      },
      {
        type: "general",
        icon: "🖱️",
        title: "Nasıl Kullanılır?",
        desc: "Çizgiler üzerindeki beyaz dairesel düğümleri (noktaları) farenizle tutarak dikey (ses/yoğunluk seviyesi için) ve yatay (zamanlama için) serbestçe sürükleyebilirsiniz."
      }
    ]
  },
  de: {
    title: "🎛️ Über Automationslinien",
    cards: [
      {
        type: "yellow",
        icon: "⚡",
        title: "Gelbe Linie (Stufenschnitt / Step Cut)",
        desc: "Sorgt für sofortige Lautstärke- oder Filteränderungen. Perfekt für Drops, plötzliche Cuts oder das sofortige Stummschalten eines Tracks."
      },
      {
        type: "cyan",
        icon: "🌊",
        title: "Türkise Linie (Sanfter Übergang / Linear Fade)",
        desc: "Steuert sanftes Ein- und Ausblenden (Fade-In / Fade-Out). Unerlässlich für professionelles Crossfading zwischen zwei Tracks im Mix."
      },
      {
        type: "purple",
        icon: "🎚️",
        title: "Lila Linie (Basispegel / EQ-Balance)",
        desc: "Hält den Hintergrundpegel oder die Frequenzbalance (z. B. Bass/EQ) während konstanter Mix-Abschnitte auf einem stabilen Niveau."
      },
      {
        type: "general",
        icon: "🖱️",
        title: "Wie bedienen?",
        desc: "Klicken und ziehen Sie die weißen Knotenpunkte auf den Linien vertikal (für den Pegel) oder horizontal (für die Zeitachse)."
      }
    ]
  }
};

let currentInfoLang = "az";

function renderLinesInfoModal(lang) {
  const data = linesInfoTranslations[lang] || linesInfoTranslations.az;
  const titleEl = document.getElementById("info-modal-title");
  const bodyEl = document.getElementById("info-modal-body");

  if (titleEl) titleEl.innerText = data.title;
  if (bodyEl) {
    bodyEl.innerHTML = data.cards.map(card => `
      <div class="line-card ${card.type}">
        <div class="line-icon">${card.icon}</div>
        <div class="line-info">
          <h4>${card.title}</h4>
          <p>${card.desc}</p>
        </div>
      </div>
    `).join("");
  }
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function getTimelineWidth() {
  const laneEl = document.getElementById("lane-1") || document.getElementById("master-timeline");
  return laneEl ? laneEl.clientWidth : 700;
}

function updateTrackName(trackNum, fileName) {
  if (!fileName) return;
  const cleanName = fileName.replace(/\.[^/.]+$/, "");

  const titleEl = document.getElementById(`track-name-${trackNum}`) || 
                  document.getElementById(`track-title-${trackNum}`) ||
                  document.querySelector(`.track-name-${trackNum}`);
  if (titleEl) {
    titleEl.innerText = cleanName;
  }

  const badgeEl = document.getElementById(`wave-badge-${trackNum}`) ||
                  document.getElementById(`clip-label-${trackNum}`) || 
                  document.getElementById(`clip-title-${trackNum}`) ||
                  document.querySelector(`#clip-track-${trackNum} .clip-label`);
  if (badgeEl) {
    badgeEl.style.display = "none";
  }

  const zoomTitleEl = document.getElementById(`zoom-title-${trackNum}`);
  if (zoomTitleEl) {
    zoomTitleEl.innerText = cleanName;
  }
}

function openYtModal(trackNum) {
  activeYtTrack = trackNum;
  const modal = document.getElementById("yt-modal");
  const status = document.getElementById("yt-status");
  const urlInput = document.getElementById("yt-url-input");
  
  if (urlInput) urlInput.value = "";
  if (status) {
    status.style.display = "none";
    status.innerText = "Mahnı serverdən emal olunur, gözləyin...";
    status.style.color = "#ffcc00";
  }
  if (modal) modal.style.display = "flex";
}

function closeYtModal() {
  const modal = document.getElementById("yt-modal");
  if (modal) modal.style.display = "none";
}

async function fetchYouTubeAudio() {
  const urlInput = document.getElementById("yt-url-input");
  const status = document.getElementById("yt-status");
  const url = urlInput ? urlInput.value.trim() : "";

  if (!url) {
    alert("Zəhmət olmasa düzgün YouTube linki daxil edin!");
    return;
  }

  if (status) {
    status.style.display = "block";
    status.innerText = "Mahnı serverdən yüklənir, xahiş olunur gözləyin...";
    status.style.color = "#ffcc00";
  }

  try {
    let customTitle = `YouTube Audio (${activeYtTrack}-ci Mahnı)`;
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData && oembedData.title) {
          customTitle = oembedData.title;
        }
      }
    } catch (titleErr) {
      console.log("YouTube adını çəkmək olmadı, standart ad istifadə edilir:", titleErr);
    }

    const downloadUrl = `/download?url=${encodeURIComponent(url)}`;
    
    // Serverin mahnını hazırladığını yoxlayırıq
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error("Server xətası: Mahnı yüklənə bilmədi.");
    }

    // ƏSAS HƏLL: Blob (süni fayl) yaradıb WaveSurfer-i bloklamaq əvəzinə,
    // birbaşa serverin linkini veririk! 
    const audioUrl = downloadUrl;

    updateTrackName(activeYtTrack, customTitle);

    if (activeYtTrack === 1) {
      currentAudioUrls.track1 = audioUrl;
      fullWs1.load(audioUrl);
      analyzeAudioMetadata(audioUrl, "bpm-1", "key-1", "zoom-bpm-1", "zoom-key-1", "track1");
      prepareMixAudioElement(1, audioUrl);
    } else {
      currentAudioUrls.track2 = audioUrl;
      fullWs2.load(audioUrl);
      analyzeAudioMetadata(audioUrl, "bpm-2", "key-2", "zoom-bpm-2", "zoom-key-2", "track2");
      prepareMixAudioElement(2, audioUrl);
    }

    closeYtModal();
  } catch (err) {
    console.error("YouTube Yükləmə Xətası:", err);
    if (status) {
      status.innerText = "Xəta baş verdi! Serverin (node server.js) açıq olduğundan və linkin düzgünlüyündən əmin olun.";
      status.style.color = "#ff4444";
    }
  }
}

function shiftTrack(trackNum, deltaPx) {
  const clip = document.getElementById(`clip-track-${trackNum}`);
  const lane = document.getElementById(`lane-${trackNum}`);
  if (!clip || !lane) return;

  const maxOffset = Math.max(0, lane.clientWidth - clip.clientWidth);
  let currentOffset = offsets[`track${trackNum}`] || 0;
  let newOffset = currentOffset + deltaPx;

  offsets[`track${trackNum}`] = Math.max(0, Math.min(maxOffset, newOffset));
  clip.style.left = `${offsets[`track${trackNum}`]}px`;
}

function prepareMixAudioElement(trackNum, url) {
  const ctx = getAudioContext();
  const audioEl = new Audio();
  audioEl.src = url;
  audioEl.preload = "auto";
  audioEl.crossOrigin = "anonymous";

  if (trackNum === 1) {
    if (mixAudio1) { try { mixAudio1.pause(); } catch(e){} }
    if (mixSourceNode1) { try { mixSourceNode1.disconnect(); } catch(e){} }
    mixAudio1 = audioEl;
    mixSourceNode1 = ctx.createMediaElementSource(audioEl);
  } else {
    if (mixAudio2) { try { mixAudio2.pause(); } catch(e){} }
    if (mixSourceNode2) { try { mixSourceNode2.disconnect(); } catch(e){} }
    mixAudio2 = audioEl;
    mixSourceNode2 = ctx.createMediaElementSource(audioEl);
  }
}

function clearMixTimeouts() {
  mixTimeouts.forEach(id => clearTimeout(id));
  mixTimeouts = [];
}

function analyzeAudioMetadata(url, bpmId, keyId, zoomBpmId, zoomKeyId, trackKey) {
  const ctx = getAudioContext();
  fetch(url)
    .then(r => r.arrayBuffer())
    .then(buf => ctx.decodeAudioData(buf))
    .then(audioBuf => {
      decodedAudioBuffers[trackKey] = audioBuf;
      let bpm = Math.round(115 + (audioBuf.duration % 20));
      let key = CAMELOT_KEYS[Math.floor(audioBuf.duration) % CAMELOT_KEYS.length];

      const bpmEl = document.getElementById(bpmId);
      const keyEl = document.getElementById(keyId);
      const zoomBpmEl = document.getElementById(zoomBpmId);
      const zoomKeyEl = document.getElementById(zoomKeyId);

      if (bpmEl) bpmEl.value = bpm;
      if (keyEl) keyEl.value = key;
      if (zoomBpmEl) zoomBpmEl.innerText = bpm;
      if (zoomKeyEl) zoomKeyEl.innerText = key;
    })
    .catch(() => {
      const bpmEl = document.getElementById(bpmId);
      const keyEl = document.getElementById(keyId);
      if (bpmEl) bpmEl.value = "124";
      if (keyEl) keyEl.value = "8A";
    });
}

function sliceAudioBuffer(buffer, startSec, endSec) {
  if (!buffer) return null;
  const ctx = getAudioContext();
  const sampleRate = buffer.sampleRate;
  const startSample = Math.max(0, Math.floor((startSec || 0) * sampleRate));
  const endSample = Math.min(buffer.length, Math.floor((endSec || buffer.duration) * sampleRate));

  if (endSample <= startSample) return buffer;
  const frameCount = endSample - startSample;

  const newBuffer = ctx.createBuffer(buffer.numberOfChannels, frameCount, sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const oldData = buffer.getChannelData(channel);
    const newData = newBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      newData[i] = oldData[startSample + i] || 0;
    }
  }
  return newBuffer;
}

function audioBufferToWavUrl(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][i];
      sample = Math.max(-1, Math.min(1, sample));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function initFullWaveform(containerId, durationInputId, previewBtnId, isTrack1) {
  const ws = WaveSurfer.create({
    container: containerId,
    waveColor: isTrack1 ? '#3a4454' : '#4a3a54',
    progressColor: isTrack1 ? '#00e5ff' : '#d000ff',
    height: 120,
    normalize: true
  });

  const wsRegions = ws.registerPlugin(WaveSurfer.Regions.create());
  if (isTrack1) regionsPlugin1 = wsRegions;
  else regionsPlugin2 = wsRegions;

  function updateRegionData(region) {
    if (!region) return;
    const regData = {
      start: region.start,
      end: region.end,
      duration: Math.max(0.1, region.end - region.start)
    };
    if (isTrack1) {
      selectedRegion1 = regData;
    } else {
      selectedRegion2 = regData;
    }

    const durInput = document.getElementById(durationInputId);
    if (durInput && document.activeElement !== durInput) {
      durInput.value = Math.round(regData.duration);
    }
  }

  ws.on('decode', () => {
    wsRegions.clearRegions();
    const audioDuration = ws.getDuration();
    const durInput = document.getElementById(durationInputId);
    let len = durInput ? (parseFloat(durInput.value) || 30) : 30;

    if (len > audioDuration) {
      len = audioDuration;
      if (durInput) durInput.value = Math.round(len);
    }

    const reg = wsRegions.addRegion({
      start: 0,
      end: len,
      color: isTrack1 ? 'rgba(0, 229, 255, 0.3)' : 'rgba(208, 0, 255, 0.3)',
      drag: true,
      resize: true
    });

    if (reg.element) {
      reg.element.style.boxSizing = "border-box";
      reg.element.style.border = "2px solid #ffffff";
      reg.element.style.height = "calc(100% - 4px)";
      reg.element.style.top = "2px";
      reg.element.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.5)";
      reg.element.style.outline = "2px solid #ffffff";
      reg.element.style.outlineOffset = "-2px";
    }

    updateRegionData(reg);

    reg.on('update', () => updateRegionData(reg));
    reg.on('update-end', () => updateRegionData(reg));

    if (durInput) {
      durInput.setAttribute("min", "1");

      const handleDurationChange = (e) => {
        let val = parseFloat(e.target.value);

        if (isNaN(val) || val <= 0) {
          alert("Aralıq xanasına 0 və ya 0-dan kiçik ədəd daxil edilə bilməz!");
          val = 1;
          e.target.value = 1;
        }

        let newLen = val;
        if (reg.start + newLen > audioDuration) {
          newLen = audioDuration - reg.start;
          e.target.value = Math.round(newLen);
        }

        reg.setOptions({
          start: reg.start,
          end: reg.start + Math.max(0.1, newLen)
        });
        updateRegionData(reg);
      };

      durInput.oninput = handleDurationChange;
      durInput.onchange = handleDurationChange;
    }

    const previewBtn = document.getElementById(previewBtnId);
    if (previewBtn) previewBtn.disabled = false;
  });

  wsRegions.on('region-updated', (region) => {
    updateRegionData(region);
  });

  ws.on('timeupdate', (currentTime) => {
    const regData = isTrack1 ? selectedRegion1 : selectedRegion2;
    const trackKey = isTrack1 ? 'track1' : 'track2';
    if (previewState[trackKey] && currentTime >= regData.end) {
      ws.pause();
      previewState[trackKey] = false;
      const btn = document.getElementById(previewBtnId);
      if (btn) {
        btn.innerText = "▶ Dinlə";
        btn.style.background = "#00e5ff";
      }
    }
  });

  return { ws, wsRegions };
}

function setupPacemakerAutomation(canvasId, trackNum, linesData, customWidth) {
  const oldCanvas = document.getElementById(canvasId);
  if (!oldCanvas) return;

  const canvas = oldCanvas.cloneNode(true);
  oldCanvas.parentNode.replaceChild(canvas, oldCanvas);

  const ctx = canvas.getContext("2d");

  const effectiveWidth = customWidth || canvas.parentElement.clientWidth || 700;
  canvas.width = effectiveWidth;
  canvas.height = 130;

  canvas.style.position = 'absolute';
  canvas.style.top = '0px';
  canvas.style.left = '0px';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '20';
  canvas.style.pointerEvents = 'auto';
  canvas.style.background = 'transparent';

  if (trackNum === 1) globalTrack1Lines = linesData;
  else globalTrack2Lines = linesData;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    linesData.forEach(line => {
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 3.5;

      if (line.type === "step") {
        ctx.moveTo(0, line.y1);
        ctx.lineTo(line.stepX, line.y1);
        ctx.lineTo(line.stepX, line.y2);
        ctx.lineTo(canvas.width, line.y2);
        ctx.stroke();

        drawHandle(ctx, line.stepX, line.y1, line.color);
        drawHandle(ctx, line.stepX, line.y2, line.color);
      }
      else if (line.type === "ramp") {
        ctx.moveTo(0, line.p1.y);
        ctx.lineTo(line.p1.x, line.p1.y);
        ctx.lineTo(line.p2.x, line.p2.y);
        ctx.lineTo(canvas.width, line.p2.y);
        ctx.stroke();

        drawHandle(ctx, line.p1.x, line.p1.y, line.color);
        drawHandle(ctx, line.p2.x, line.p2.y, line.color);
      }
    });
  }

  function drawHandle(ctx, x, y, color) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  function getHitNode(mouseX, mouseY, radius = 12) {
    for (let line of linesData) {
      if (line.type === "step") {
        if (Math.hypot(line.stepX - mouseX, line.y1 - mouseY) <= radius) return { type: "stepNode", line, nodeType: "top" };
        if (Math.hypot(line.stepX - mouseX, line.y2 - mouseY) <= radius) return { type: "stepNode", line, nodeType: "bottom" };
      } else if (line.type === "ramp") {
        if (Math.hypot(line.p1.x - mouseX, line.p1.y - mouseY) <= radius) {
          return { type: "rampNode", point: line.p1, pairPoint: line.p2, isFirst: true };
        }
        if (Math.hypot(line.p2.x - mouseX, line.p2.y - mouseY) <= radius) {
          return { type: "rampNode", point: line.p2, pairPoint: line.p1, isFirst: false };
        }
      }
    }
    return null;
  }

  canvas.addEventListener("mousemove", (e) => {
    const scaleX = canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1;
    const scaleY = canvas.clientHeight > 0 ? canvas.height / canvas.clientHeight : 1;
    const mouseX = e.offsetX * scaleX;
    const mouseY = e.offsetY * scaleY;
    const hoveredNode = getHitNode(mouseX, mouseY, 16);
    canvas.style.cursor = hoveredNode ? "pointer" : "grab";
  });

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1;
    const scaleY = canvas.clientHeight > 0 ? canvas.height / canvas.clientHeight : 1;
    const mouseX = e.offsetX * scaleX;
    const mouseY = e.offsetY * scaleY;

    const activeTarget = getHitNode(mouseX, mouseY, 16);

    if (activeTarget) {
      e.stopPropagation();
      e.preventDefault();

      const onMove = (moveEvent) => {
        const cx = Math.max(10, Math.min(canvas.width - 10, (moveEvent.clientX - rect.left) * scaleX));
        const cy = Math.max(0, Math.min(canvas.height - 10, (moveEvent.clientY - rect.top) * scaleY));

        if (activeTarget.type === "stepNode") {
          activeTarget.line.stepX = cx;
          if (activeTarget.nodeType === "top") activeTarget.line.y1 = cy;
          else activeTarget.line.y2 = cy;
        } else if (activeTarget.type === "rampNode") {
          activeTarget.point.y = cy;
          if (activeTarget.isFirst) {
            activeTarget.point.x = Math.min(cx, activeTarget.pairPoint.x - 5);
          } else {
            activeTarget.point.x = Math.max(cx, activeTarget.pairPoint.x + 5);
          }
        }
        draw();
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
    else {
      let startX = e.clientX;
      let initOffset = offsets[`track${trackNum}`] || 0;
      const lane = document.getElementById(`lane-${trackNum}`);
      const clip = document.getElementById(`clip-track-${trackNum}`);
      if (!lane || !clip) return;

      const maxOffset = Math.max(0, lane.clientWidth - clip.clientWidth);

      const onClipDrag = (moveEvent) => {
        let newOffset = initOffset + (moveEvent.clientX - startX);
        offsets[`track${trackNum}`] = Math.max(0, Math.min(maxOffset, newOffset));
        clip.style.left = `${offsets[`track${trackNum}`]}px`;
      };
      const onClipUp = () => {
        window.removeEventListener("mousemove", onClipDrag);
        window.removeEventListener("mouseup", onClipUp);
      };
      window.addEventListener("mousemove", onClipDrag);
      window.addEventListener("mouseup", onClipUp);
    }
  });

  draw();
}

function evaluateAutomationY(linesData, localX) {
  if (!linesData || linesData.length === 0) return 0;
  let totalY = 0;

  linesData.forEach(line => {
    let y = 0;
    if (line.type === "step") {
      y = (localX < line.stepX) ? line.y1 : line.y2;
    } else if (line.type === "ramp") {
      if (localX <= line.p1.x) y = line.p1.y;
      else if (localX >= line.p2.x) y = line.p2.y;
      else {
        let ratio = Math.max(0, Math.min(1, (localX - line.p1.x) / ((line.p2.x - line.p1.x) || 1)));
        y = line.p1.y + ratio * (line.p2.y - line.p1.y);
      }
    }
    totalY += y;
  });

  return totalY / linesData.length;
}

function updateMasterPlayhead() {
  const ctx = getAudioContext();
  if (!isPlaying || !ctx) return;

  const playheadEl = document.getElementById("global-playhead");
  const timelineWidth = getTimelineWidth();

  const elapsedSeconds = ctx.currentTime - playbackStartTime;

  playheadX = (elapsedSeconds / mixDurationSeconds) * timelineWidth;
  if (playheadEl) {
    playheadEl.style.left = `${playheadX}px`;
  }

  const track1StartSec = (offsets.track1 / timelineWidth) * mixDurationSeconds;
  const track1Duration = selectedRegion1.duration || mixDurationSeconds;
  const track1EndSec = track1StartSec + track1Duration;

  if (elapsedSeconds >= track1StartSec && elapsedSeconds <= track1EndSec) {
    let localTrack1Time = elapsedSeconds - track1StartSec;
    let clip1El = document.getElementById("clip-track-1");
    let clip1Width = clip1El ? clip1El.clientWidth : timelineWidth;
    let localX1 = (localTrack1Time / track1Duration) * clip1Width;

    let targetY1 = evaluateAutomationY(globalTrack1Lines, localX1);
    let volume1 = Math.max(0, Math.min(1, 1 - (targetY1 / 130)));

    if (gainNode1) {
      gainNode1.gain.setTargetAtTime(volume1, ctx.currentTime, 0.01);
    }
  } else {
    if (gainNode1) {
      gainNode1.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
    }
    if (elapsedSeconds > track1EndSec && mixAudio1 && !mixAudio1.paused) {
      mixAudio1.pause();
    }
  }

  const track2StartSec = (offsets.track2 / timelineWidth) * mixDurationSeconds;
  const track2Duration = selectedRegion2.duration || mixDurationSeconds;
  const track2EndSec = track2StartSec + track2Duration;

  if (elapsedSeconds >= track2StartSec && elapsedSeconds <= track2EndSec) {
    let localTrack2Time = elapsedSeconds - track2StartSec;
    let clip2El = document.getElementById("clip-track-2");
    let clip2Width = clip2El ? clip2El.clientWidth : timelineWidth;
    let localX2 = (localTrack2Time / track2Duration) * clip2Width;

    let targetY2 = evaluateAutomationY(globalTrack2Lines, localX2);
    let volume2 = Math.max(0, Math.min(1, 1 - (targetY2 / 130)));

    if (gainNode2) {
      gainNode2.gain.setTargetAtTime(volume2, ctx.currentTime, 0.01);
    }
  } else {
    if (gainNode2) {
      gainNode2.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
    }
    if (elapsedSeconds > track2EndSec && mixAudio2 && !mixAudio2.paused) {
      mixAudio2.pause();
    }
  }

  if (elapsedSeconds >= mixDurationSeconds) {
    stopMixPlayback();
    return;
  }

  playheadAnimationId = requestAnimationFrame(updateMasterPlayhead);
}

async function startMixPlayback() {
  if (isPlaying) return;
  if (!mixAudio1 && !mixAudio2) return;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  isPlaying = true;
  playbackStartTime = ctx.currentTime;
  clearMixTimeouts();

  const timelineWidth = getTimelineWidth();
  const track1StartSec = (offsets.track1 / timelineWidth) * mixDurationSeconds;
  const track2StartSec = (offsets.track2 / timelineWidth) * mixDurationSeconds;

  if (mixAudio1 && mixSourceNode1) {
    gainNode1 = ctx.createGain();
    gainNode1.gain.setValueAtTime(1, ctx.currentTime);
    try { mixSourceNode1.disconnect(); } catch (e) {}
    mixSourceNode1.connect(gainNode1);
    gainNode1.connect(ctx.destination);

    const startDelayMs1 = Math.max(0, track1StartSec) * 1000;
    const startPos1 = activeWavUrls.track1 ? 0 : selectedRegion1.start;
    mixTimeouts.push(setTimeout(() => {
      if (!isPlaying) return;
      mixAudio1.currentTime = startPos1;
      mixAudio1.play().catch(() => {});
    }, startDelayMs1));
  }

  if (mixAudio2 && mixSourceNode2) {
    gainNode2 = ctx.createGain();
    gainNode2.gain.setValueAtTime(1, ctx.currentTime);
    try { mixSourceNode2.disconnect(); } catch (e) {}
    mixSourceNode2.connect(gainNode2);
    gainNode2.connect(ctx.destination);

    const startDelayMs2 = Math.max(0, track2StartSec) * 1000;
    const startPos2 = activeWavUrls.track2 ? 0 : selectedRegion2.start;
    mixTimeouts.push(setTimeout(() => {
      if (!isPlaying) return;
      mixAudio2.currentTime = startPos2;
      mixAudio2.play().catch(() => {});
    }, startDelayMs2));
  }

  const playheadEl = document.getElementById("global-playhead");
  if (playheadEl) {
    playheadEl.style.display = "block";
    playheadEl.style.left = "0px";
  }

  const playBtn = document.getElementById("play-mix-btn");
  if (playBtn) {
    playBtn.innerText = "⏸ Dayandır";
    playBtn.style.background = "#ffcc00";
  }

  playheadAnimationId = requestAnimationFrame(updateMasterPlayhead);
}

function stopMixPlayback() {
  isPlaying = false;
  cancelAnimationFrame(playheadAnimationId);
  clearMixTimeouts();

  const playheadEl = document.getElementById("global-playhead");
  if (playheadEl) playheadEl.style.display = "none";

  if (mixAudio1) { try { mixAudio1.pause(); mixAudio1.currentTime = 0; } catch (e) {} }
  if (mixAudio2) { try { mixAudio2.pause(); mixAudio2.currentTime = 0; } catch (e) {} }

  const playBtn = document.getElementById("play-mix-btn");
  if (playBtn) {
    playBtn.innerText = "▶ Miksi Oxut";
    playBtn.style.background = "#00ff66";
  }
}

async function renderMixBuffer() {
  if (!slicedAudioBuffers.track1 && !slicedAudioBuffers.track2) {
    throw new Error("Eksport etmək üçün ən azı bir mahnı yüklənməlidir!");
  }

  const sampleRate = 44100;
  const timelineWidth = getTimelineWidth();
  const totalSamples = Math.ceil(sampleRate * mixDurationSeconds);
  const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, totalSamples, sampleRate);

  if (slicedAudioBuffers.track1) {
    const buf1 = slicedAudioBuffers.track1;
    const track1StartSec = (offsets.track1 / timelineWidth) * mixDurationSeconds;
    const dur1 = selectedRegion1.duration || mixDurationSeconds;

    const source1 = offlineCtx.createBufferSource();
    source1.buffer = buf1;

    const offlineGain1 = offlineCtx.createGain();
    const clip1El = document.getElementById("clip-track-1");
    const clip1Width = clip1El ? clip1El.clientWidth : timelineWidth;

    const stepCount = Math.ceil(dur1 * 40);
    for (let i = 0; i <= stepCount; i++) {
      let relTime = (i / stepCount) * dur1;
      let localX = (relTime / dur1) * clip1Width;
      let y = evaluateAutomationY(globalTrack1Lines, localX);
      let vol = Math.max(0, Math.min(1, 1 - (y / 130)));
      offlineGain1.gain.setValueAtTime(vol, track1StartSec + relTime);
    }

    source1.connect(offlineGain1);
    offlineGain1.connect(offlineCtx.destination);
    source1.start(track1StartSec);
  }

  if (slicedAudioBuffers.track2) {
    const buf2 = slicedAudioBuffers.track2;
    const track2StartSec = (offsets.track2 / timelineWidth) * mixDurationSeconds;
    const dur2 = selectedRegion2.duration || mixDurationSeconds;

    const source2 = offlineCtx.createBufferSource();
    source2.buffer = buf2;

    const offlineGain2 = offlineCtx.createGain();
    const clip2El = document.getElementById("clip-track-2");
    const clip2Width = clip2El ? clip2El.clientWidth : timelineWidth;

    const stepCount = Math.ceil(dur2 * 40);
    for (let i = 0; i <= stepCount; i++) {
      let relTime = (i / stepCount) * dur2;
      let localX = (relTime / dur2) * clip2Width;
      let y = evaluateAutomationY(globalTrack2Lines, localX);
      let vol = Math.max(0, Math.min(1, 1 - (y / 130)));
      offlineGain2.gain.setValueAtTime(vol, track2StartSec + relTime);
    }

    source2.connect(offlineGain2);
    offlineGain2.connect(offlineCtx.destination);
    source2.start(track2StartSec);
  }

  return await offlineCtx.startRendering();
}

async function exportMixToWav() {
  const downloadToggleBtn = document.getElementById("download-toggle-btn");
  try {
    if (downloadToggleBtn) downloadToggleBtn.innerText = "⏳ WAV Hazırlanır...";
    const renderedBuffer = await renderMixBuffer();
    const wavUrl = audioBufferToWavUrl(renderedBuffer);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = wavUrl;
    a.download = "dj_mashup_mix.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("WAV Eksport xətası:", err);
    alert(err.message || "WAV eksport edərkən xəta baş verdi.");
  } finally {
    if (downloadToggleBtn) downloadToggleBtn.innerText = "⬇ Yüklə ▼";
  }
}

async function exportMixToMp3() {
  const downloadToggleBtn = document.getElementById("download-toggle-btn");
  try {
    if (typeof lamejs === "undefined") {
      alert("MP3 formatına çevirmək üçün 'lame.min.js' kitabxanası yüklənməyib!");
      return;
    }
    if (downloadToggleBtn) downloadToggleBtn.innerText = "⏳ MP3 Hazırlanır...";

    const renderedBuffer = await renderMixBuffer();
    const channels = renderedBuffer.numberOfChannels;
    const sampleRate = renderedBuffer.sampleRate;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 192);
    const mp3Data = [];

    const left = renderedBuffer.getChannelData(0);
    const right = channels > 1 ? renderedBuffer.getChannelData(1) : left;

    const sampleBlockSize = 1152;
    const leftInt16 = new Int16Array(left.length);
    const rightInt16 = new Int16Array(right.length);

    for (let i = 0; i < left.length; i++) {
      let sL = Math.max(-1, Math.min(1, left[i]));
      leftInt16[i] = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;
      let sR = Math.max(-1, Math.min(1, right[i]));
      rightInt16[i] = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;
    }

    for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
      const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
      let mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const endBuf = mp3encoder.flush();
    if (endBuf.length > 0) {
      mp3Data.push(endBuf);
    }

    const blob = new Blob(mp3Data, { type: 'audio/mp3' });
    const mp3Url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = mp3Url;
    a.download = "dj_mashup_mix.mp3";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("MP3 Eksport xətası:", err);
    alert(err.message || "MP3 eksport edərkən xəta baş verdi.");
  } finally {
    if (downloadToggleBtn) downloadToggleBtn.innerText = "⬇ Yüklə ▼";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getAudioContext();

  // İlk açılışda Xətlər Haqqında modalını Azərbaycan dilində render et
  renderLinesInfoModal(currentInfoLang);

  // Xətlər Haqqında Modalı aç/bağla düymələri
  const openInfoBtn = document.getElementById("open-lines-info-btn");
  const closeInfoBtn = document.getElementById("close-lines-info-btn");
  const infoModal = document.getElementById("lines-info-modal");

  if (openInfoBtn && infoModal) {
    openInfoBtn.addEventListener("click", () => {
      infoModal.style.display = "flex";
    });
  }

  if (closeInfoBtn && infoModal) {
    closeInfoBtn.addEventListener("click", () => {
      infoModal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === infoModal) {
      infoModal.style.display = "none";
    }
  });

  // Dil düymələrinin idarə edilməsi
  const langButtons = document.querySelectorAll(".lang-btn");
  langButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      langButtons.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentInfoLang = e.target.getAttribute("data-lang");
      renderLinesInfoModal(currentInfoLang);
    });
  });

  const full1 = initFullWaveform('#full-waveform-1', 'duration-1', 'preview-btn-1', true);
  const full2 = initFullWaveform('#full-waveform-2', 'duration-2', 'preview-btn-2', false);
  fullWs1 = full1.ws;
  fullWs2 = full2.ws;

  const audioFile1 = document.getElementById("audio-file-1");
  if (audioFile1) {
    audioFile1.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        updateTrackName(1, file.name);
        const url = URL.createObjectURL(file);
        currentAudioUrls.track1 = url;
        fullWs1.load(url);
        analyzeAudioMetadata(url, "bpm-1", "key-1", "zoom-bpm-1", "zoom-key-1", "track1");
        prepareMixAudioElement(1, url);
      }
    });
  }

  const audioFile2 = document.getElementById("audio-file-2");
  if (audioFile2) {
    audioFile2.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        updateTrackName(2, file.name);
        const url = URL.createObjectURL(file);
        currentAudioUrls.track2 = url;
        fullWs2.load(url);
        analyzeAudioMetadata(url, "bpm-2", "key-2", "zoom-bpm-2", "zoom-key-2", "track2");
        prepareMixAudioElement(2, url);
      }
    });
  }

  const prevBtn1 = document.getElementById("preview-btn-1");
  if (prevBtn1) {
    prevBtn1.addEventListener("click", () => {
      if (!previewState.track1) {
        previewState.track1 = true;
        fullWs1.setTime(selectedRegion1.start);
        fullWs1.play();
        prevBtn1.innerText = "⏸ Dayandır";
        prevBtn1.style.background = "#ffcc00";
      } else {
        previewState.track1 = false;
        fullWs1.pause();
        prevBtn1.innerText = "▶ Dinlə";
        prevBtn1.style.background = "#00e5ff";
      }
    });
  }

  const prevBtn2 = document.getElementById("preview-btn-2");
  if (prevBtn2) {
    prevBtn2.addEventListener("click", () => {
      if (!previewState.track2) {
        previewState.track2 = true;
        fullWs2.setTime(selectedRegion2.start);
        fullWs2.play();
        prevBtn2.innerText = "⏸ Dayandır";
        prevBtn2.style.background = "#ffcc00";
      } else {
        previewState.track2 = false;
        fullWs2.pause();
        prevBtn2.innerText = "▶ Dinlə";
        prevBtn2.style.background = "#00e5ff";
      }
    });
  }

  const zoomBtn = document.getElementById("zoom-transition-btn");
  if (zoomBtn) {
    zoomBtn.addEventListener("click", () => {
      if (previewState.track1) { fullWs1.pause(); previewState.track1 = false; }
      if (previewState.track2) { fullWs2.pause(); previewState.track2 = false; }

      if (zoomWs1) { zoomWs1.destroy(); zoomWs1 = null; }
      if (zoomWs2) { zoomWs2.destroy(); zoomWs2 = null; }
      document.querySelector('#zoomed-waveform-1').innerHTML = '';
      document.querySelector('#zoomed-waveform-2').innerHTML = '';

      if (regionsPlugin1 && regionsPlugin1.getRegions && regionsPlugin1.getRegions().length > 0) {
        const reg = regionsPlugin1.getRegions()[0];
        selectedRegion1 = { start: reg.start, end: reg.end, duration: Math.max(0.1, reg.end - reg.start) };
      }
      if (regionsPlugin2 && regionsPlugin2.getRegions && regionsPlugin2.getRegions().length > 0) {
        const reg = regionsPlugin2.getRegions()[0];
        selectedRegion2 = { start: reg.start, end: reg.end, duration: Math.max(0.1, reg.end - reg.start) };
      }

      document.getElementById("selection-view").style.display = "none";
      document.getElementById("zoom-view").style.display = "block";

      const timelineWidth = getTimelineWidth();

      const rawBuffer1 = decodedAudioBuffers.track1 || fullWs1.getDecodedData();
      const rawBuffer2 = decodedAudioBuffers.track2 || fullWs2.getDecodedData();

      let dur1 = selectedRegion1.duration || 30;
      if (rawBuffer1) {
        const slicedBuf1 = sliceAudioBuffer(rawBuffer1, selectedRegion1.start, selectedRegion1.end);
        slicedAudioBuffers.track1 = slicedBuf1;
      }

      let dur2 = selectedRegion2.duration || 30;
      if (rawBuffer2) {
        const slicedBuf2 = sliceAudioBuffer(rawBuffer2, selectedRegion2.start, selectedRegion2.end);
        slicedAudioBuffers.track2 = slicedBuf2;
      }

      mixDurationSeconds = Math.max(dur1, dur2, 1) + EXTRA_WORKSPACE_SEC;

      const width1 = (dur1 / mixDurationSeconds) * timelineWidth;
      const width2 = (dur2 / mixDurationSeconds) * timelineWidth;

      offsets.track1 = 0;
      offsets.track2 = 0;

      const clip1El = document.getElementById("clip-track-1");
      const clip2El = document.getElementById("clip-track-2");
      if (clip1El) {
        clip1El.style.width = `${width1}px`;
        clip1El.style.left = "0px";
      }
      if (clip2El) {
        clip2El.style.width = `${width2}px`;
        clip2El.style.left = "0px";
      }

      if (activeWavUrls.track1) URL.revokeObjectURL(activeWavUrls.track1);
      if (activeWavUrls.track2) URL.revokeObjectURL(activeWavUrls.track2);

      if (slicedAudioBuffers.track1) {
        const slicedWavUrl1 = audioBufferToWavUrl(slicedAudioBuffers.track1);
        activeWavUrls.track1 = slicedWavUrl1;
        prepareMixAudioElement(1, slicedWavUrl1);
        const pxPerSec1 = width1 / Math.max(dur1, 0.1);
        zoomWs1 = WaveSurfer.create({
          container: '#zoomed-waveform-1',
          waveColor: '#5a626e',
          progressColor: '#5a626e',
          height: 130,
          normalize: true,
          autoScroll: false,
          interact: false,
          cursorWidth: 0,
          minPxPerSec: pxPerSec1
        });
        zoomWs1.load(slicedWavUrl1);
      }

      if (slicedAudioBuffers.track2) {
        const slicedWavUrl2 = audioBufferToWavUrl(slicedAudioBuffers.track2);
        activeWavUrls.track2 = slicedWavUrl2;
        prepareMixAudioElement(2, slicedWavUrl2);
        const pxPerSec2 = width2 / Math.max(dur2, 0.1);
        zoomWs2 = WaveSurfer.create({
          container: '#zoomed-waveform-2',
          waveColor: '#5a626e',
          progressColor: '#5a626e',
          height: 130,
          normalize: true,
          autoScroll: false,
          interact: false,
          cursorWidth: 0,
          minPxPerSec: pxPerSec2
        });
        zoomWs2.load(slicedWavUrl2);
      }

      const durInput1 = document.getElementById("duration-1");
      if (durInput1) durInput1.value = Math.round(mixDurationSeconds);

      setTimeout(() => {
        const W1 = (clip1El && clip1El.clientWidth > 0) ? clip1El.clientWidth : timelineWidth;
        const W2 = (clip2El && clip2El.clientWidth > 0) ? clip2El.clientWidth : timelineWidth;

        setupPacemakerAutomation("canvas-track-1", 1, [
          { type: "step", color: "#ffcc00", stepX: W1 * 0.5, y1: 25, y2: 105 },
          { type: "ramp", color: "#00e5ff", p1: {x: W1 * 0.2, y: 105}, p2: {x: W1 * 0.8, y: 25} },
          { type: "ramp", color: "#d000ff", p1: {x: W1 * 0.3, y: 65}, p2: {x: W1 * 0.7, y: 65} }
        ], W1);

        setupPacemakerAutomation("canvas-track-2", 2, [
          { type: "ramp", color: "#00e5ff", p1: {x: W2 * 0.2, y: 25}, p2: {x: W2 * 0.8, y: 105} },
          { type: "step", color: "#ffcc00", stepX: W2 * 0.5, y1: 105, y2: 25 }
        ], W2);
      }, 150);

      // --- DÜYMƏLƏRİN VƏ XƏTLƏR HAQQINDA DÜYMƏSİNİN AKTİVLƏŞMƏSİ ---
      document.getElementById("zoom-transition-btn").style.display = "none";
      document.getElementById("open-lines-info-btn").style.display = "inline-block";
      document.getElementById("play-mix-btn").style.display = "inline-block";
      document.getElementById("back-to-select-btn").style.display = "inline-block";

      const dlContainer = document.getElementById("download-container");
      if (dlContainer) dlContainer.style.display = "inline-block";
    });
  }

  const playMixBtn = document.getElementById("play-mix-btn");
  if (playMixBtn) {
    playMixBtn.addEventListener("click", () => {
      if (!isPlaying) startMixPlayback();
      else stopMixPlayback();
    });
  }

  const dlToggleBtn = document.getElementById("download-toggle-btn");
  const dlMenu = document.getElementById("download-menu");
  if (dlToggleBtn && dlMenu) {
    dlToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dlMenu.style.display = (dlMenu.style.display === "block") ? "none" : "block";
    });
    document.addEventListener("click", () => {
      dlMenu.style.display = "none";
    });
  }

  const exportWavBtn = document.getElementById("export-wav");
  if (exportWavBtn) {
    exportWavBtn.addEventListener("click", (e) => {
      e.preventDefault();
      exportMixToWav();
    });
  }

  const exportMp3Btn = document.getElementById("export-mp3");
  if (exportMp3Btn) {
    exportMp3Btn.addEventListener("click", (e) => {
      e.preventDefault();
      exportMixToMp3();
    });
  }

  const backBtn = document.getElementById("back-to-select-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      stopMixPlayback();

      if (zoomWs1) { zoomWs1.destroy(); zoomWs1 = null; }
      if (zoomWs2) { zoomWs2.destroy(); zoomWs2 = null; }
      document.querySelector('#zoomed-waveform-1').innerHTML = '';
      document.querySelector('#zoomed-waveform-2').innerHTML = '';

      if (activeWavUrls.track1) { URL.revokeObjectURL(activeWavUrls.track1); activeWavUrls.track1 = null; }
      if (activeWavUrls.track2) { URL.revokeObjectURL(activeWavUrls.track2); activeWavUrls.track2 = null; }

      if (currentAudioUrls.track1) prepareMixAudioElement(1, currentAudioUrls.track1);
      if (currentAudioUrls.track2) prepareMixAudioElement(2, currentAudioUrls.track2);

      document.getElementById("zoom-view").style.display = "none";
      document.getElementById("selection-view").style.display = "block";
      
      // --- GERİ QAYIDANDA XƏTLƏR HAQQINDA DÜYMƏSİNİ GİZLƏDİRİK ---
      document.getElementById("zoom-transition-btn").style.display = "inline-block";
      document.getElementById("open-lines-info-btn").style.display = "none";
      document.getElementById("play-mix-btn").style.display = "none";
      document.getElementById("back-to-select-btn").style.display = "none";

      const dlContainer = document.getElementById("download-container");
      if (dlContainer) dlContainer.style.display = "none";
    });
  }
});