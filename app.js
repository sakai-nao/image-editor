const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const previewCanvas = document.getElementById("previewCanvas");
const ctx = previewCanvas.getContext("2d");

const dpiRange = document.getElementById("dpiRange");
const dpiValue = document.getElementById("dpiValue");
const toneRange = document.getElementById("toneRange");
const toneValue = document.getElementById("toneValue");

let originalImage = null;

// 初期状態でプレビュー画面を非表示
previewCanvas.style.display = "none";

// クリックでファイル選択を開く
dropArea.addEventListener("click", () => fileInput.click());

// ファイル選択イベント
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    loadImage(e.target.files[0]);
  }
});

// ドラッグ&ドロップイベントを抑制
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  dropArea.addEventListener(eventName, e => e.preventDefault());
});

dropArea.addEventListener("drop", e => {
  if (e.dataTransfer.files.length > 0) {
    loadImage(e.dataTransfer.files[0]);
  }
});

// 画像を読み込んで表示
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = function() {
      originalImage = img;
      dropArea.style.display = "none"; 
      previewCanvas.style.display = "block"; 

      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      dpiRange.max = img.width;
      dpiRange.value = img.width;
      dpiValue.innerText = `${img.width} DPI`;

      toneRange.value = "7";  
      toneValue.innerText = "256";  

      updateCanvas();
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}
