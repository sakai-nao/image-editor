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

// スライダーイベント
dpiRange.addEventListener("input", () => {
  dpiValue.innerText = `${dpiRange.value} DPI`;
  updateCanvas();
});

toneRange.addEventListener("input", () => {
  const toneLevels = 2 ** (parseInt(toneRange.value, 10) + 1);
  toneValue.innerText = toneLevels;
  updateCanvas();
});

// 画像処理
function updateCanvas() {
  if (!originalImage) return;

  const currentDpi = parseInt(dpiRange.value, 10);
  dpiValue.innerText = `${currentDpi} DPI`;

  const originalWidth = originalImage.width;
  const originalHeight = originalImage.height;
  const scaleFactor = currentDpi / originalWidth;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  // DPI の値に応じて縮小した画像サイズを決定
  tempCanvas.width = Math.max(1, Math.floor(originalWidth * scaleFactor));
  tempCanvas.height = Math.max(1, Math.floor(originalHeight * scaleFactor));

  tempCtx.imageSmoothingEnabled = false;
  tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);

  // 縮小された解像度のまま表示
  previewCanvas.width = originalWidth;
  previewCanvas.height = originalHeight;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempCanvas, 0, 0, originalWidth, originalHeight);

  // 階調（減色）処理
  let imageData = ctx.getImageData(0, 0, originalWidth, originalHeight);
  let data = imageData.data;
  const toneLevels = 2 ** (parseInt(toneRange.value, 10) + 1);
  const step = 255 / (toneLevels - 1);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step;
    data[i + 1] = Math.round(data[i + 1] / step) * step;
    data[i + 2] = Math.round(data[i + 2] / step) * step;
  }

  ctx.putImageData(imageData, 0, 0);
}
