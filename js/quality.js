// If a device can't keep up, draw fewer pixels instead of stuttering. A few steps down, never back up.
export function watchQuality(renderer, resize) {
  let last = performance.now();
  let total = 0;
  let count = 0;
  const check = (now) => {
    const gap = now - last;
    last = now;
    // Long gaps mean the tab was in the background, which says nothing about speed
    if (gap < 200) {
      total += gap;
      count++;
    }
    if (count === 45) {
      const ratio = renderer.getPixelRatio();
      if (total / count > 26 && ratio > 0.75) {
        renderer.setPixelRatio(Math.max(0.75, ratio - 0.5));
        resize();
      }
      total = 0;
      count = 0;
    }
    requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}
