/** Tiny shared store so the WebGL scenes and React UI can talk without re-rendering every frame. */
const listeners = new Map();

export const store = {
  thumbs: {}, // pizzaId -> dataURL (rendered top-down by the 3D line-up scene)
  lineupIndex: 0,
  loaded: false,
};

export function setStore(key, value) {
  store[key] = value;
  listeners.get(key)?.forEach((fn) => fn(value));
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
}

/** Commands sent from anywhere in the UI to the line-up section (e.g. "show The Dreamer"). */
export const bus = new EventTarget();
export const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
export const on = (type, fn) => {
  const h = (e) => fn(e.detail);
  bus.addEventListener(type, h);
  return () => bus.removeEventListener(type, h);
};
