// HTMLの要素を取得
const dropArea = document.getElementById("dropArea"); // 画像をドラッグ&ドロップする領域
const fileInput = document.getElementById("fileInput"); // ファイル選択ボタン
const previewCanvas = document.getElementById("previewCanvas"); // 画像を描画するCanvas
const ctx = previewCanvas.getContext("2d"); // Canvasの描画コンテキスト

// スライダー要素を取得
const dpiRange = document.getElementById("dpiRange"); // 解像度（DPI）スライダー
const dpiValue = document.getElementById("dpiValue"); // DPIの数値表示
const toneRange = document.getElementById("toneRange"); // 階調（コントラスト）スライダー
const toneValue = document.getElementById("toneValue"); // 階調の数値表示

let originalImage = null; // アップロードした画像データを保持する変数

// 初期状態でプレビュー画面を非表示にする
previewCanvas.style.display = "none";

// クリックでファイル選択を開く
dropArea.addEventListener("click", () => fileInput.click());

// ファイルが選択されたときの処理
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    loadImage(e.target.files[0]); // 選択したファイルを読み込む
  }
});

// ドラッグ&ドロップイベントを防ぐ（デフォルトの動作を無効化）
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  dropArea.addEventListener(eventName, e => e.preventDefault());
});

// 画像がドロップされたときの処理
dropArea.addEventListener("drop", e => {
  if (e.dataTransfer.files.length > 0) {
    loadImage(e.dataTransfer.files[0]); // ドロップされたファイルを読み込む
  }
});

// 画像を読み込んでCanvasに表示
function loadImage(file) {
  const reader = new FileReader(); // ファイルを読み込むためのオブジェクト
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = function() {
      originalImage = img; // 読み込んだ画像を保存

      // 画像をアップロードしたら #dropArea を非表示にする
      dropArea.style.display = "none";
      
      // プレビュー画面（Canvas）を表示
      previewCanvas.style.display = "block";

      // Canvasのサイズを画像サイズに設定
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height); // 画像をCanvasに描画

      // スライダーの最大値を画像サイズに設定
      dpiRange.max = img.width;
      dpiRange.value = img.width;
      dpiValue.innerText = `${img.width} DPI`;

      // 階調スライダーを 2～256 の段階式にする
      toneRange.min = "0";  
      toneRange.max = "7";  
      toneRange.value = "7"; 
      toneValue.innerText = "256"; 

      updateCanvas();
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

// スライダーの値が変更されたら画像を更新
dpiRange.addEventListener("input", updateCanvas);
toneRange.addEventListener("input", () => {
  const toneLevels = 2 ** (parseInt(toneRange.value, 10) + 1); 
  toneValue.innerText = toneLevels;
  updateCanvas();
});

// Canvasを更新する関数
function updateCanvas() {
  if (!originalImage) return; 

  const currentDpi = parseInt(dpiRange.value, 10);
  dpiValue.innerText = `${currentDpi} DPI`;

  const originalWidth = originalImage.width;
  const originalHeight = originalImage.height;
  const scaleFactor = currentDpi / originalWidth; 

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  // DPIの値に応じて、縮小した画像サイズを決定
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
