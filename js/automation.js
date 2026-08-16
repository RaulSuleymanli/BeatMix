// Hər mahnı üçün interaktiv xətt idarəedicisini yaradan sinif
class AutomationLayer {
  constructor(canvasId, isTrack1) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.isTrack1 = isTrack1;
    
    // Əsas rənglər
    this.fadeColor = isTrack1 ? '#00a2ff' : '#d000ff'; // 1-ci mahnı Göy, 2-ci mahnı Bənövşəyi
    this.bassColor = '#ffb700'; // Sarı (Bass)
    this.gridColor = '#00ff66'; // Yaşıl (Keçid başlanğıcı)

    this.points = [];
    this.draggingPoint = null;

    if (this.canvas) {
      this.init();
    }
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Başlanğıc nöqtələrini qururuq (X, Y koordinatları)
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.isTrack1) {
      // 1-ci Mahnı: Səs yuxarıdan başlayır, aşağı düşür (Fade Out)
      this.points = [
        { x: w * 0.2, y: 20, type: 'green-grid', label: 'Cue' }, // Yaşıl xətt nöqtəsi
        { x: w * 0.5, y: 20, type: 'fade' },                    // Göy xəttin qırılma nöqtəsi
        { x: w * 0.9, y: h - 20, type: 'fade' },                // Göy xəttin sonu
        { x: w * 0.5, y: h * 0.4, type: 'bass-swap' }           // Sarı bas kəsim nöqtəsi
      ];
    } else {
      // 2-ci Mahnı: Səs aşağıdan başlayır, yuxarı qalxır (Fade In)
      this.points = [
        { x: w * 0.2, y: 20, type: 'green-grid', label: 'Cue' },
        { x: w * 0.5, y: h - 20, type: 'fade' },                // Bənövşəyi xəttin başlanğıcı
        { x: w * 0.9, y: 20, type: 'fade' },                    // Bənövşəyi xəttin sonu
        { x: w * 0.5, y: h * 0.6, type: 'bass-swap' }           // Sarı bas giriş nöqtəsi
      ];
    }

    this.addMouseListeners();
    this.draw();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  // Siçanla (Mouse) nöqtələri tutub sürüşdürmək məntiqi
  addMouseListeners() {
    this.canvas.addEventListener('mousedown', (e) => {
      const { x, y } = this.getMousePos(e);
      // Hansı nöqtənin üzərinə tıklandığını tapırıq
      this.draggingPoint = this.points.find(p => Math.hypot(p.x - x, p.y - y) < 12);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.draggingPoint) return;
      const { x, y } = this.getMousePos(e);
      
      // Nöqtəni siçanın yerinə daşıyırıq (kənarlardan çıxmaması şərtilə)
      this.draggingPoint.x = Math.max(10, Math.min(this.canvas.width - 10, x));
      this.draggingPoint.y = Math.max(10, Math.min(this.canvas.height - 10, y));
      
      this.draw();
    });

    window.addEventListener('mouseup', () => {
      this.draggingPoint = null;
    });
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. YAŞIL ŞAQULİ XƏTT (Beat Grid / Cue Point)
    const gridPoint = this.points.find(p => p.type === 'green-grid');
    if (gridPoint) {
      ctx.beginPath();
      ctx.strokeStyle = this.gridColor;
      ctx.lineWidth = 2;
      ctx.moveTo(gridPoint.x, 0);
      ctx.lineTo(gridPoint.x, h);
      ctx.stroke();
    }

    // 2. SARI XƏTT (Bass Swap Automation)
    const bassPoint = this.points.find(p => p.type === 'bass-swap');
    if (bassPoint) {
      ctx.beginPath();
      ctx.strokeStyle = this.bassColor;
      ctx.lineWidth = 2;
      if (this.isTrack1) {
        // 1-ci mahnıda bas yuxarıdan gəlir və nöqtədə aşağı düşür
        ctx.moveTo(0, h * 0.3);
        ctx.lineTo(bassPoint.x, h * 0.3);
        ctx.lineTo(bassPoint.x, h - 10);
        ctx.lineTo(w, h - 10);
      } else {
        // 2-ci mahnıda bas aşağıdan gəlir və nöqtədə yuxarı qalxır
        ctx.moveTo(0, h - 10);
        ctx.lineTo(bassPoint.x, h - 10);
        ctx.lineTo(bassPoint.x, h * 0.7);
        ctx.lineTo(w, h * 0.7);
      }
      ctx.stroke();
    }

    // 3. GÖY / BƏNÖVŞƏYİ XƏTT (Volume / High-Mid Fade)
    const fadePoints = this.points.filter(p => p.type === 'fade');
    if (fadePoints.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = this.fadeColor;
      ctx.lineWidth = 3;
      ctx.moveTo(0, fadePoints[0].y);
      ctx.lineTo(fadePoints[0].x, fadePoints[0].y);
      ctx.lineTo(fadePoints[1].x, fadePoints[1].y);
      ctx.lineTo(w, fadePoints[1].y);
      ctx.stroke();
    }

    // 4. İDARƏETMƏ NÖQTƏLƏRİ (Düyünlər - Əl ilə sürmək üçün ağ dairələr)
    this.points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = (p.type === 'fade') ? this.fadeColor : (p.type === 'bass-swap' ? this.bassColor : this.gridColor);
      ctx.stroke();
    });
  }
}