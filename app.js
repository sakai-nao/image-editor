// HTMLの要素を取得
const dropArea = document.getElementById("dropArea"); // 画像をドラッグ&ドロップする領域
const fileInput = document.getElementById("fileInput"); // ファイル選択ボタン
const previewCanvas = document.getElementById("previewCanvas"); // 処理後の画像を描画するCanvas
const originalCanvas = document.getElementById("originalCanvas"); // 処理前の画像を描画するCanvas
const ctx = previewCanvas.getContext("2d"); // 処理後Canvasの描画コンテキスト
const origCtx = originalCanvas.getContext("2d"); // 処理前Canvasの描画コンテキスト

// 画像情報を表示する要素
const originalResolution = document.getElementById("originalResolution");
const originalTone = document.getElementById("originalTone");
const previewResolution = document.getElementById("previewResolution");
const previewTone = document.getElementById("previewTone");

// スライダー要素を取得（DPIからピクセルに変更）
const resolutionRange = document.getElementById("resolutionRange"); // 解像度（px）スライダー
const resolutionValue = document.getElementById("resolutionValue"); // 解像度の数値表示
const toneRange = document.getElementById("toneRange"); // 階調（コントラスト）スライダー
const toneValue = document.getElementById("toneValue"); // 階調の数値表示

// RGB切り替えとグレースケールのチェックボックスを取得
const redCheck = document.getElementById("redCheck");
const greenCheck = document.getElementById("greenCheck");
const blueCheck = document.getElementById("blueCheck");
const grayscaleCheck = document.getElementById("grayscaleCheck");

// データ量表示要素
const dataSize = document.getElementById("dataSize");
const dataSizeDetail = document.getElementById("dataSizeDetail");
const dataSizeBytes = document.getElementById("dataSizeBytes");

let originalImage = null; // アップロードした画像データを保持する変数

// 初期状態でプレビュー画面を非表示にする
previewCanvas.style.display = "none";
originalCanvas.style.display = "none";
document.getElementById("comparisonView").style.display = "none";
document.querySelector(".data-size-container").style.display = "none";

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
      
      // 比較表示コンテナを表示
      document.getElementById("comparisonView").style.display = "flex";
      
      // データ量表示コンテナを表示
      document.querySelector(".data-size-container").style.display = "block";
      
      // プレビュー画面（Canvas）を表示
      previewCanvas.style.display = "block";
      originalCanvas.style.display = "block";

      // Canvasのサイズを画像サイズに設定
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      
      // 元画像を描画
      origCtx.drawImage(img, 0, 0, img.width, img.height);
      // 処理画像を描画（初期表示）
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // スライダーの最大値を画像サイズに設定（解像度スライダー）
      resolutionRange.max = img.width;
      resolutionRange.value = img.width;
      resolutionValue.innerText = `${img.width} px`;

      // 階調スライダーを 2のべき乗の値 (1-8で指数部分を表現) に対応
      toneRange.min = "1";  // 2^1 = 2
      toneRange.max = "8";  // 2^8 = 256
      toneRange.value = "8"; // 初期値は256階調（フル）
      const toneLevels = Math.pow(2, parseInt(toneRange.value, 10));
      toneValue.innerText = toneLevels.toString(); 

      // RGB・グレースケールのコントロールを表示
      document.getElementById("colorControls").style.display = "flex";

      // 元の画像情報を表示
      updateOriginalInfo();

      // 処理画像を更新（初期設定）
      updateCanvas();
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

// 元の画像情報を表示する関数
function updateOriginalInfo() {
  if (!originalImage) return;
  
  const width = originalImage.width;
  const height = originalImage.height;
  const fullToneLevels = 256; // 元画像はフル階調（256色）と仮定
  
  originalResolution.innerHTML = `解像度: ${width} x ${height} px`;
  originalTone.innerHTML = `階調: ${fullToneLevels}`;
}

// スライダーとチェックボックスの値が変更されたら画像を更新
resolutionRange.addEventListener("input", updateCanvas);
toneRange.addEventListener("input", () => {
  // 2のべき乗で階調を表示
  const toneLevels = Math.pow(2, parseInt(toneRange.value, 10));
  toneValue.innerText = toneLevels.toString();
  updateCanvas();
});

// RGBチェックボックスのイベントリスナーを設定
redCheck.addEventListener("change", updateCanvas);
greenCheck.addEventListener("change", updateCanvas);
blueCheck.addEventListener("change", updateCanvas);
grayscaleCheck.addEventListener("change", updateCanvas);

// Canvasを更新する関数
function updateCanvas() {
  if (!originalImage) return; 

  // 解像度の値を取得（ピクセル単位）
  const currentResolution = parseInt(resolutionRange.value, 10);
  resolutionValue.innerText = `${currentResolution} px`;

  const originalWidth = originalImage.width;
  const originalHeight = originalImage.height;
  const scaleFactor = currentResolution / originalWidth; 

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  // 設定された解像度（px）に応じて、縮小した画像サイズを決定
  tempCanvas.width = Math.max(1, Math.floor(originalWidth * scaleFactor));
  tempCanvas.height = Math.max(1, Math.floor(originalHeight * scaleFactor));

  tempCtx.imageSmoothingEnabled = false;
  tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);

  // 縮小された解像度のまま表示
  previewCanvas.width = originalWidth;
  previewCanvas.height = originalHeight;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempCanvas, 0, 0, originalWidth, originalHeight);

  // 階調（減色）処理とRGB/グレースケール処理
  let imageData = ctx.getImageData(0, 0, originalWidth, originalHeight);
  let data = imageData.data;
  
  // 2のべき乗で階調数を計算（2^n）
  const toneLevels = Math.pow(2, parseInt(toneRange.value, 10));
  const step = 255 / (toneLevels - 1); 

  // チェックボックスの状態を取得
  const useRed = redCheck.checked;
  const useGreen = greenCheck.checked;
  const useBlue = blueCheck.checked;
  const useGrayscale = grayscaleCheck.checked;

  for (let i = 0; i < data.length; i += 4) {
    // グレースケール処理
    if (useGrayscale) {
      // 輝度を計算 (0.299R + 0.587G + 0.114B)
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const quantizedGray = Math.round(gray / step) * step;
      
      // 全チャンネルに同じ値を設定
      data[i] = useRed ? quantizedGray : 0;
      data[i + 1] = useGreen ? quantizedGray : 0;
      data[i + 2] = useBlue ? quantizedGray : 0;
    } else {
      // RGBチャンネル個別処理
      data[i] = useRed ? Math.round(data[i] / step) * step : 0;       // R
      data[i + 1] = useGreen ? Math.round(data[i + 1] / step) * step : 0; // G
      data[i + 2] = useBlue ? Math.round(data[i + 2] / step) * step : 0;  // B
    }
    // アルファチャンネルはそのまま
  }

  ctx.putImageData(imageData, 0, 0);
  
  // 処理後の画像情報を更新
  updatePreviewInfo(tempCanvas.width, tempCanvas.height, toneLevels);
  
  // データ量を計算して表示
  updateDataSizeInfo(tempCanvas.width, tempCanvas.height, toneLevels);
}

// 処理後の画像情報を表示する関数
function updatePreviewInfo(width, height, toneLevels) {
  const bitDepth = Math.log2(toneLevels); // 2のべき乗の指数を取得
  previewResolution.innerHTML = `解像度: ${width} x ${height} px`;
  previewTone.innerHTML = `階調: ${toneLevels} (${bitDepth}bit)`;
}


// データ量を計算して表示する関数
function updateDataSizeInfo(width, height, toneLevels) {
  const useRed = redCheck.checked;
  const useGreen = greenCheck.checked;
  const useBlue = blueCheck.checked;
  const useGrayscale = grayscaleCheck.checked;

  let bitsPerPixel = 0;

  if (useGrayscale) {
    // グレースケールの場合は1チャンネルで計算
    bitsPerPixel = Math.log2(toneLevels);
  } else {
    // RGBの場合、チェックされているチャンネルごとにビット数を加算
    if (useRed) bitsPerPixel += Math.log2(toneLevels);
    if (useGreen) bitsPerPixel += Math.log2(toneLevels);
    if (useBlue) bitsPerPixel += Math.log2(toneLevels);
  }

  const totalPixels = width * height;
  const totalBits = totalPixels * bitsPerPixel;
  const totalBytes = totalBits / 8;
  const totalKB = totalBytes / 1024;

  // 表示を更新
  dataSize.innerHTML = `縦 ${height} px × 横 ${width} px × ${Math.round(bitsPerPixel)} bit`;
  dataSizeDetail.innerHTML = `色ビット数: ${Math.round(bitsPerPixel)} bit, 合計: ${totalBits.toLocaleString()} bit`;
  dataSizeBytes.innerHTML = `${totalBytes.toLocaleString()} B (${totalKB.toFixed(2)} KB)`;

  // グレースケール時の追加表示
  if (useGrayscale) {
    dataSize.innerHTML += `（グレースケール）`;
  }
}
