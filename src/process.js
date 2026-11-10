let goReady;
let rustReady;

function waitForGo() {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    function poll() {
      if (globalThis.photoGray) { resolve(); return; }
      if (Date.now() - started > 8000) { reject(new Error('Go 준비 시간 초과')); return; }
      setTimeout(poll, 20);
    }
    poll();
  });
}

export function loadGo() {
  if (!goReady) goReady = (async () => {
    if (!globalThis.Go) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${import.meta.env.BASE_URL}wasm/wasm_exec.js`;
        script.onload = resolve;
        script.onerror = reject;
        document.head.append(script);
      });
    }
    const go = new globalThis.Go();
    const response = await fetch(`${import.meta.env.BASE_URL}wasm/photo.wasm`);
    if (!response.ok) throw new Error('Go 모듈 불러오기 실패');
    const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), go.importObject);
    void go.run(instance);
    await waitForGo();
  })().catch((error) => { goReady = null; throw error; });
  return goReady;
}

export function loadRust() {
  if (!rustReady) rustReady = (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}wasm/light.wasm`);
    if (!response.ok) throw new Error('Rust 모듈 불러오기 실패');
    const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
    return instance.exports;
  })().catch((error) => { rustReady = null; throw error; });
  return rustReady;
}

export async function averageLight(pixels) {
  const rust = await loadRust();
  let sum = 0;
  for (let index = 0; index < pixels.length; index += 4) sum += rust.luminance(pixels[index], pixels[index + 1], pixels[index + 2]);
  return rust.light_percent(sum, pixels.length / 4);
}

export async function grayscale(pixels) {
  await loadGo();
  return globalThis.photoGray(pixels);
}
