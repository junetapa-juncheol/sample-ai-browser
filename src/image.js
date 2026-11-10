export function fitSize(width, height, limit = 640) {
  if (width <= 0 || height <= 0 || width * height > 40000000) throw new Error('4천만 화소 이하의 사진을 선택해 주세요.');
  const scale = Math.min(1, limit / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function checkFile(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPG, PNG, WebP 사진을 선택해 주세요.');
  if (file.size > 15000000) throw new Error('15MB 이하의 사진을 선택해 주세요.');
}

export function topPredictions(values, labels, count = 3) {
  return Array.from(values, (probability, index) => ({ probability, className: labels[index] || `분류 ${index}` }))
    .sort((left, right) => right.probability - left.probability).slice(0, count);
}
