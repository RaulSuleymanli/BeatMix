// Camelot Açar Uyğunluğunu Yoxlayan Funksiya
function checkCamelotCompatibility(key1, key2) {
  // Açarları böyük hərfə çeviririk və boşluqları silirik
  k1 = key1.trim().toUpperCase();
  k2 = key2.trim().toUpperCase();

  // Eyni açardırsa (məs: 5A və 5A) -> Mükəmməl harmoniya
  if (k1 === k2) {
    return { status: "Mükəmməl Uyğunluq (Eyni Ton)", color: "#00e5ff" };
  }

  // Rəqəm və hərf hissələrini ayırırıq
  const num1 = parseInt(k1);
  const letter1 = k1.slice(-1);
  const num2 = parseInt(k2);
  const letter2 = k2.slice(-1);

  // 1. Eyni rəqəm, fərqli hərf (məs: 5A və 5B -> Major/Minor keçidi)
  if (num1 === num2 && letter1 !== letter2) {
    return { status: "Harmonik Uyğunluq (Enerji Dəyişimi)", color: "#00ff66" };
  }

  // 2. Eyni hərf, +-1 rəqəm fərqi (məs: 5A ilə 4A və ya 6A / 12A ilə 1A)
  if (letter1 === letter2) {
    const diff = Math.abs(num1 - num2);
    if (diff === 1 || diff === 11) {
      return { status: "Harmonik Uyğunluq (Səlis Keçid)", color: "#00ff66" };
    }
  }

  // Digər hallarda uyğunsuzluq
  return { status: "Uyğunsuz Tonallıq (Səs Toqquşması Ola Bilər)", color: "#ff3333" };
}

// UI-da durumu yeniləyən funksiya
function updateCamelotUI() {
  const key1Input = document.getElementById("key-1");
  const key2Input = document.getElementById("key-2");
  const statusText = document.getElementById("key-status-text");

  if (!key1Input || !key2Input || !statusText) return;

  const result = checkCamelotCompatibility(key1Input.value, key2Input.value);
  statusText.textContent = result.status;
  statusText.style.color = result.color;
}

// Qutularda yazı dəyişəndə avtomatik hesabla
document.addEventListener("DOMContentLoaded", () => {
  const key1Input = document.getElementById("key-1");
  const key2Input = document.getElementById("key-2");

  if (key1Input && key2Input) {
    key1Input.addEventListener("input", updateCamelotUI);
    key2Input.addEventListener("input", updateCamelotUI);
    updateCamelotUI(); // İlk açılışda işlət
  }
});