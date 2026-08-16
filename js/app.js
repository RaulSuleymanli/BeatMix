// Bütün fayllar yükləndikdən sonra proqramı başlat
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎧 DJ Mix Automation Studio yükləndi!");

  // Track 1 və Track 2 üçün interaktiv xətt qatlarını yaradırıq
  const autoLayer1 = new AutomationLayer('canvas-1', true);  // True = Göy xətt (Track 1)
  const autoLayer2 = new AutomationLayer('canvas-2', false); // False = Bənövşəyi xətt (Track 2)

  // Oxut (Play) düyməsi funksionallığı
  const playBtn = document.getElementById("play-mix-btn");
  let isPlaying = false;

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      isPlaying = !isPlaying;
      
      if (isPlaying) {
        playBtn.textContent = "⏸ Mix-i Dayandır";
        playBtn.style.backgroundColor = "#d000ff";
        // Əgər audio fayl yüklənibsə, ikisini də eyni anda başlat
        if (typeof wavesurfer1 !== "undefined" && wavesurfer1.isPlaying() === false) {
          wavesurfer1.playPause();
        }
        if (typeof wavesurfer2 !== "undefined" && wavesurfer2.isPlaying() === false) {
          wavesurfer2.playPause();
        }
      } else {
        playBtn.textContent = "▶ Mix-i Oxut";
        playBtn.style.backgroundColor = "#ff7b00";
        if (typeof wavesurfer1 !== "undefined") wavesurfer1.pause();
        if (typeof wavesurfer2 !== "undefined") wavesurfer2.pause();
      }
    });
  }
});