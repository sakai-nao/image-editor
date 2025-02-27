// **📌 HTMLの要素を取得**
const dropArea = document.getElementById("dropArea"); // 画像をドラッグ&ドロップする領域
const fileInput = document.getElementById("fileInput"); // ファイル選択ボタン
const previewCanvas = document.getElementById("previewCanvas"); // 画像を描画するCanvas
const ctx = previewCanvas.getContext("2d"); // Canvasの描画コンテキスト

// **📌 スライダー要素を取得**
const dpiRange = document.getElementById("dpiRange"); // 解像度（DPI）スライダー
const dpiValue = document.getElementById("dpiValue"); // DPIの数値表示
const toneRange = document.getElementById("toneRange"); // 階調（コントラスト）スライダー

let originalImage = null; // **アップロードした画像データを保持する変数**

// **📌 クリックでファイル選択を開く**
dropArea.addEventListener("click", () => fileInput.click());

// **📌 ファイルが選択されたときの処理**
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    loadImage(e.target.files[0]); // 選択したファイルを読み込む
  }
});

// **📌 ドラッグ&ドロップイベントを防ぐ（デフォルトの動作を無効化）**
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  dropArea.addEventListener(eventName, e => e.preventDefault());
});

// **📌 画像がドロップされたときの処理**
dropArea.addEventListener("drop", e => {
  if (e.dataTransfer.files.length > 0) {
    loadImage(e.dataTransfer.files[0]); // ドロップされたファイルを読み込む
  }
});

// **📌 画像を読み込んでCanvasに表示**
function loadImage(file) {
  const reader = new FileReader(); // **ファイルを読み込むためのオブジェクト**
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = function() {
      originalImage = img; // **読み込んだ画像を保存**

      // **📌 画像をアップロードしたら #dropArea を非表示にする**
      dropArea.style.display = "none";
      
      // **📌 Canvasのサイズを画像サイズに設定**
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height); // **画像をCanvasに描画**

      // **📌 スライダーの最大値を画像サイズに設定**
      dpiRange.max = img.width; // DPIの最大値を画像の幅にする
      dpiRange.value = img.width; // 初期値を画像の元サイズにする
      dpiValue.innerText = `${img.width} DPI`; // DPIの数値を更新

      toneRange.value = 100; // **階調スライダーをリセット**
      updateCanvas(); // **画像を更新**
    };
    img.src = evt.target.result; // **画像のデータURLを設定**
  };
  reader.readAsDataURL(file); // **ファイルをデータURLとして読み込む**
}

// **📌 スライダーの値が変更されたら画像を更新**
dpiRange.addEventListener("input", updateCanvas);
toneRange.addEventListener("input", updateCanvas);

// **📌 Canvasを更新する関数**
function updateCanvas() {
  if (!originalImage) return; // **画像が読み込まれていない場合は何もしない**

  const currentDpi = parseInt(dpiRange.value, 10); // **現在のDPI値を取得**
  dpiValue.innerText = `${currentDpi} DPI`; // **DPIの数値を更新**

  const originalWidth = originalImage.width;
  const originalHeight = originalImage.height;
  const scaleFactor = currentDpi / originalWidth; // **DPIの倍率を計算**

  const tempCanvas = document.createElement("canvas"); // **一時的なCanvasを作成**
  const tempCtx = tempCanvas.getContext("2d");

  // **📌 DPIの値に応じて、縮小した画像サイズを決定**
  tempCanvas.width = Math.max(1, Math.floor(originalWidth * scaleFactor));
  tempCanvas.height = Math.max(1, Math.floor(originalHeight * scaleFactor));

  tempCtx.imageSmoothingEnabled = false; // **ぼかしを防ぐ（最近傍補間を使用）**
  tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);

  // **📌 縮小された解像度のまま表示**
  previewCanvas.width = originalWidth;
  previewCanvas.height = originalHeight;
  ctx.imageSmoothingEnabled = false; // **ぼかしを防ぐ**
  ctx.drawImage(tempCanvas, 0, 0, originalWidth, originalHeight);

  // **📌 階調（コントラスト）処理**
  let imageData = ctx.getImageData(0, 0, originalWidth, originalHeight);
  let data = imageData.data;
  const toneFactor = (parseInt(toneRange.value, 10) - 100) / 100;

  // **📌 画像の各ピクセルに対して明るさを調整**
  for (let i = 0; i < data.length; i += 4) {
    let brightness = (data[i] + data[i + 1] + data[i + 2]) / 3; // **ピクセルの明るさを計算**
    data[i] = brightness + (data[i] - brightness) * (1 + toneFactor); // **赤**
    data[i + 1] = brightness + (data[i + 1] - brightness) * (1 + toneFactor); // **緑**
    data[i + 2] = brightness + (data[i + 2] - brightness) * (1 + toneFactor); // **青**
  }

  ctx.putImageData(imageData, 0, 0); // **変更した画像をCanvasに反映**
}
