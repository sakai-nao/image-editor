const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const previewCanvas = document.getElementById("previewCanvas");
const ctx = previewCanvas.getContext("2d");

const dpiRange = document.getElementById("dpiRange");
const dpiValue = document.getElementById("dpiValue");
const toneRange = document.getElementById("toneRange");
const toneValue = document.getElementById("toneValue");

let originalImage = null;
const canvasWidth = 400; // 表示サイズの幅
const canvasHeight = 300; // 表示サイズの高さ

// **クリックでファイル選択**
dropArea.addEventListener("click", () => fileInput.click());

// **ファイル選択イベント**
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    loadImage(e.target.files[0]);
  }
});

// **ドラッグ&ドロップイベント**
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  dropArea.addEventListener(eventName, e => e.preventDefault());
});

dropArea.addEventListener("drop", e => {
  if (e.dataTransfer.files.length > 0) {
    loadImage(e.dataTransfer.files[0]);
  }
});

// **画像読み込み**
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = function() {
      originalImage = img;

      // **スライダーの最大値を画像サイズに設定**
      dpiRange.max = img.width;
      dpiRange.value = img.width;
      dpiValue.innerText = `${img.width} DPI`;

      toneRange.value = 100;
      toneValue.innerText = "100";

      updateCanvas();
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

// **スライダーイベント**
dpiRange.addEventListener("input", updateCanvas);
toneRange.addEventListener("input", () => {
  toneValue.innerText = toneRange.value; // 階調の値をリアルタイム表示
  updateCanvas();
});

// **Canvas更新処理**
function updateCanvas() {
  if (!originalImage) return;

  const currentDpi = parseInt(dpiRange.value, 10);
  dpiValue.innerText = `${currentDpi} DPI`;

  const scaleFactor = currentDpi / originalImage.width;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = Math.floor(originalImage.width * scaleFactor);
  tempCanvas.height = Math.floor(originalImage.height * scaleFactor);

  tempCtx.imageSmoothingEnabled = false;
  tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);

  previewCanvas.width = canvasWidth;
  previewCanvas.height = canvasHeight;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempCanvas, 0, 0, canvasWidth, canvasHeight);

  let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  let data = imageData.data;
  const toneFactor = (parseInt(toneRange.value, 10) - 100) / 100;

  for (let i = 0; i < data.length; i += 4) {
    let brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = brightness + (data[i] - brightness) * (1 + toneFactor);
    data[i + 1] = brightness + (data[i + 1] - brightness) * (1 + toneFactor);
    data[i + 2] = brightness + (data[i + 2] - brightness) * (1 + toneFactor);
  }

  ctx.putImageData(imageData, 0, 0);
}
