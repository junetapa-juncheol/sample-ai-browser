import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkFile, fitSize, topPredictions } from '../src/image.js';

test('large images are reduced without changing the aspect ratio', () => {
  assert.deepEqual(fitSize(2400, 1200), { width: 640, height: 320 });
  assert.deepEqual(fitSize(20, 40), { width: 20, height: 40 });
  assert.throws(() => fitSize(10000, 10000), /화소/);
});

test('unsupported and oversized files are rejected before reading', () => {
  assert.throws(() => checkFile({ type: 'text/plain', size: 20 }), /사진/);
  assert.throws(() => checkFile({ type: 'image/png', size: 15000001 }), /15MB/);
});

test('top classes come from model probabilities in descending order', () => {
  assert.deepEqual(topPredictions([0.1, 0.7, 0.2], { 0: 'cat', 1: 'dog', 2: 'bird' }, 2), [
    { probability: 0.7, className: 'dog' }, { probability: 0.2, className: 'bird' },
  ]);
});

test('the compiled Rust module measures light from pixels', async () => {
  const { instance } = await WebAssembly.instantiate(await readFile('public/wasm/light.wasm'), {});
  assert.equal(instance.exports.luminance(255, 0, 0), 76);
  assert.equal(instance.exports.light_percent(255 * 10, 10), 100);
  assert.equal(instance.exports.light_percent(0, 0), 0);
});
