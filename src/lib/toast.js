// Tiny toast bus. Components call toast('Saved', { kind: 'success' });
// the <Toaster /> mounted in App renders the queue. No deps, no context.

const listeners = new Set();
let queue = [];
let nextId = 1;

const emit = () => listeners.forEach((l) => l(queue));

export const toast = (message, { kind = 'info', duration = 2600 } = {}) => {
  const id = nextId++;
  queue = [...queue, { id, message, kind }];
  emit();
  setTimeout(() => {
    queue = queue.filter((t) => t.id !== id);
    emit();
  }, duration);
  return id;
};

export const dismissToast = (id) => {
  queue = queue.filter((t) => t.id !== id);
  emit();
};

export const subscribeToasts = (fn) => {
  listeners.add(fn);
  fn(queue);
  return () => listeners.delete(fn);
};
