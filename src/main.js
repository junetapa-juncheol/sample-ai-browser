import './style.css';
import './theme.css';
import { checkFile, fitSize, topPredictions } from './image.js';
import { averageLight, grayscale, loadGo, loadRust } from './process.js';

document.querySelector('#app').innerHTML = `
<div class="shell">
<header><a href="./" class="brand"><span class="brand-mark" aria-hidden="true">n</span>느린빛 사진관</a><nav aria-label="주요 메뉴"><a href="#studio">사진 살펴보기</a><a href="#how" class="wide">이용 안내 ↗</a></nav></header>
<main id="main"><section class="hero"><div><span class="eyebrow">NEURINBIT · PHOTO STUDIO</span><h1>한 장의 사진,<br>어떤 이야기가 보이나요?</h1><p class="lede">사진 속 사물과 풍경을 살펴보는 작은 실험실.<br>모든 과정은 지금 사용 중인 브라우저 안에서 이루어집니다.</p></div><span class="badge"><span class="dot"></span>사진 전송 0 · 사진 저장 0</span></section>
<div class="studio-grid" id="studio"><section class="panel photo-panel"><div class="section-head"><div><span class="section-label">01 / 사진 선택</span><h2>오늘의 한 장</h2></div><span class="pill">LOCAL ONLY</span></div><div class="photo-stage" id="stage"><div id="placeholder"><svg aria-hidden="true" width="56" height="56" viewBox="0 0 56 56" fill="none"><rect x="8" y="12" width="40" height="32" rx="4" stroke="currentColor" stroke-width="1.5"/><circle cx="21" cy="23" r="4" stroke="currentColor" stroke-width="1.5"/><path d="m10 40 12-11 9 8 7-6 8 9" stroke="currentColor" stroke-width="1.5"/></svg><strong>사진을 이곳에 놓아주세요</strong><span>또는 아래 버튼으로 선택하세요</span></div><canvas id="photo" hidden aria-label="선택한 사진 미리보기"></canvas></div><input id="file" class="file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="분류할 사진 선택"/><div class="actions space-top"><button class="primary" id="choose">사진 선택하기 <span aria-hidden="true">＋</span></button><button id="clear" disabled>비우기</button><span class="tiny">JPG · PNG · WebP / 15MB 이하</span></div><p class="status" id="file-status" role="status">사진은 새로고침하거나 비우기를 누르면 기기 메모리에서 해제됩니다.</p><div class="photo-toolbar"><span>빛의 정도 <strong id="light">—</strong></span><button id="gray" disabled>흑백으로 보기</button></div><p class="tiny" id="process-status">Go · Rust WebAssembly 준비 중</p></section>
<div class="stack"><section class="panel"><div class="section-head"><div><span class="section-label">02 / 사진 속 단서</span><h2>무엇이 담겨 있을까요?</h2></div><span class="pill">TensorFlow.js</span></div><div class="model-state"><span class="dot"></span><span id="model-status" role="status">분류 모델은 필요할 때 불러옵니다.</span></div><div id="predictions" class="prediction-empty">사진을 고르면<br>가능성이 높은 사물 3가지를 보여드립니다.</div><button id="classify" class="primary classify" disabled>사진 분류하기 ↗</button><p class="status" id="classify-status" role="status"></p><p class="tiny">MobileNet v1 · 1,000개 사물 분류 · 영문 이름<br>비율은 모델의 추정값이며 실제 내용과 다를 수 있습니다.</p></section><section class="panel" id="how"><span class="section-label">A LITTLE PEACE OF MIND</span><h2>사진은 여기 머물러요.</h2><ol class="privacy-list"><li><span>01</span><div><strong>기기 안에서만 분류</strong><p>사진과 분류 결과를 서버로 보내지 않습니다.</p></div></li><li><span>02</span><div><strong>기록을 남기지 않아요</strong><p>파일명, 사진, 결과를 저장하지 않습니다.</p></div></li><li><span>03</span><div><strong>가볍게 경험하기</strong><p>사물·풍경 사진으로 체험해 보세요.</p></div></li></ol></section></div></div>
</main><footer><span>느린빛 사진관 · 가상 사진관 체험</span><span>사진을 위한 작은 브라우저 실험실 · <a href="./license.txt">MIT License</a></span></footer></div>`;

const $ = (id) => document.getElementById(id);
const canvas = $('photo');
const context = canvas.getContext('2d', { willReadFrequently: true });
let original = null;
let model;
let tf;
let labels;
let busy = false;
let monochrome = false;
let fileVersion = 0;

function controls() {
  $('choose').disabled = busy;
  $('clear').disabled = busy || !original;
  $('gray').disabled = busy || !original;
  $('classify').disabled = busy || !original;
}

function resetPredictions() {
  $('predictions').className = 'prediction-empty';
  $('predictions').textContent = '분류하기를 누르면 사진 속 사물 3가지를 보여드립니다.';
  $('classify-status').textContent = '';
}

async function selectFile(file) {
  if (busy) return;
  const version = ++fileVersion;
  let url;
  try {
    checkFile(file);
    url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    await image.decode();
    if (version !== fileVersion) return;
    const size = fitSize(image.naturalWidth, image.naturalHeight);
    canvas.width = size.width;
    canvas.height = size.height;
    context.drawImage(image, 0, 0, size.width, size.height);
    original = context.getImageData(0, 0, size.width, size.height);
    canvas.hidden = false;
    $('placeholder').hidden = true;
    monochrome = false;
    $('gray').textContent = '흑백으로 보기';
    $('file-status').textContent = `${image.naturalWidth} × ${image.naturalHeight} · 기기 메모리에만 불러왔습니다.`;
    resetPredictions();
    try { const light = await averageLight(original.data); if (version === fileVersion) $('light').textContent = `${light}%`; }
    catch { $('light').textContent = '측정 불가'; }
  } catch (error) {
    if (version === fileVersion) $('file-status').textContent = error.message || '사진을 읽지 못했습니다. 다른 사진을 선택해 주세요.';
  } finally {
    if (url) URL.revokeObjectURL(url);
    $('file').value = '';
    controls();
  }
}

async function loadModel() {
  if (model) return;
  $('model-status').textContent = '사물 분류 모델을 불러오는 중…';
  tf = await import('@tensorflow/tfjs');
  await tf.setBackend('cpu');
  await tf.ready();
  ({ IMAGENET_CLASSES: labels } = await import('@tensorflow-models/mobilenet/dist/imagenet_classes.js'));
  model = await tf.loadLayersModel(`${import.meta.env.BASE_URL}model/model.json`);
  $('model-status').textContent = '모델 준비 완료 · 기기에서 실행';
}

function renderPredictions(predictions) {
  $('predictions').replaceChildren();
  $('predictions').className = 'predictions';
  for (const [index, result] of predictions.entries()) {
    const item = document.createElement('div');
    item.className = 'prediction';
    const row = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `${String(index + 1).padStart(2, '0')}  ${result.className.split(',')[0]}`;
    const score = document.createElement('span');
    score.textContent = `${(result.probability * 100).toFixed(1)}%`;
    row.append(title, score);
    const meter = document.createElement('meter');
    meter.min = 0; meter.max = 1; meter.value = result.probability;
    meter.setAttribute('aria-label', result.className);
    item.append(row, meter);
    $('predictions').append(item);
  }
}

$('choose').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', () => void selectFile($('file').files[0]));
$('stage').addEventListener('dragover', (event) => { event.preventDefault(); $('stage').classList.add('dragging'); });
$('stage').addEventListener('dragleave', () => $('stage').classList.remove('dragging'));
$('stage').addEventListener('drop', (event) => { event.preventDefault(); $('stage').classList.remove('dragging'); void selectFile(event.dataTransfer.files[0]); });
$('clear').addEventListener('click', () => {
  ++fileVersion;
  context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 1; canvas.height = 1;
  original = null;
  $('file').value = '';
  canvas.hidden = true;
  $('placeholder').hidden = false;
  $('light').textContent = '—';
  $('gray').textContent = '흑백으로 보기';
  $('file-status').textContent = '사진을 기기 메모리에서 해제했습니다.';
  resetPredictions();
  controls();
});
$('gray').addEventListener('click', async () => {
  if (!original || busy) return;
  busy = true; controls();
  try {
    if (monochrome) context.putImageData(original, 0, 0);
    else {
      const pixels = new Uint8Array(original.data);
      const result = await grayscale(pixels);
      context.putImageData(new ImageData(new Uint8ClampedArray(result), canvas.width, canvas.height), 0, 0);
    }
    monochrome = !monochrome;
    $('gray').textContent = monochrome ? '원본으로 보기' : '흑백으로 보기';
    resetPredictions();
  } catch { $('file-status').textContent = '흑백 도구를 불러오지 못했습니다. 다시 시도해 주세요.'; }
  finally { busy = false; controls(); }
});
$('classify').addEventListener('click', async () => {
  if (!original || busy) return;
  busy = true; controls();
  let output;
  try {
    await loadModel();
    $('classify-status').textContent = '사진 속 단서를 살펴보고 있습니다…';
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const start = performance.now();
    output = tf.tidy(() => {
      const image = tf.browser.fromPixels(canvas).toFloat();
      const input = tf.image.resizeBilinear(image, [224, 224]).div(127.5).sub(1).expandDims(0);
      return model.predict(input);
    });
    const probabilities = await output.data();
    renderPredictions(topPredictions(probabilities, labels));
    $('classify-status').textContent = `분류 완료 · ${((performance.now() - start) / 1000).toFixed(2)}초 · 사진 전송 없음`;
  } catch {
    $('model-status').textContent = '분류 도구를 준비하지 못했습니다.';
    $('classify-status').textContent = '다시 눌러 시도해 주세요. 사진은 기기 안에 그대로 있습니다.';
  } finally {
    output?.dispose();
    busy = false; controls();
  }
});

Promise.all([loadGo(), loadRust()]).then(() => { $('process-status').textContent = 'Go 흑백 변환 · Rust 밝기 측정 · 기기에서 준비 완료'; }).catch(() => { $('process-status').textContent = '사진 처리 도구 연결을 확인해 주세요. 분류는 계속 이용할 수 있습니다.'; });
