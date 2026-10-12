function runFit(el, maxSize) {
  const MIN_SIZE = 6;
  const parent = el.parentElement;
  if (!parent) return;

  el.style.whiteSpace = 'nowrap';
  el.style.fontSize = maxSize + 'px';

  const cs = getComputedStyle(parent);
  const available =
    parent.clientWidth -
    parseFloat(cs.paddingLeft) -
    parseFloat(cs.paddingRight);

  if (el.scrollWidth <= available) return;

  let lo = MIN_SIZE,
    hi = maxSize;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = mid + 'px';
    if (el.scrollWidth <= available) lo = mid;
    else hi = mid;
  }
  el.style.fontSize = Math.floor(lo) + 'px';
}

export const fitText = {
  mounted(el, binding) {
    const maxSize = binding.value ?? 48;
    runFit(el, maxSize);
    const ro = new ResizeObserver(() => runFit(el, maxSize));
    ro.observe(el.parentElement);
    el._fitTextRO = ro;
  },
  updated(el, binding) {
    runFit(el, binding.value ?? 48);
  },
  unmounted(el) {
    el._fitTextRO?.disconnect();
  },
};
