import { useCallback, useEffect, useRef, useState } from 'react';

// Global-ish timer store for active set timers and rest countdowns.
// Keys are arbitrary strings (e.g., set id, "rest:<exerciseId>", "between:<dayId>").
// Timestamps are wall-clock (Date.now) so nav between views doesn't lose time.

const listeners = new Set();
const state = {
  sets: {}, // id -> { startedAt }
  rests: {}, // id -> { startedAt, duration }
};

const emit = () => listeners.forEach((l) => l());

// ---------- rest-end chime ----------
// Two short rising beeps via Web Audio — no asset download, works offline.
// AudioContext must be created after a user gesture; we lazily create it on
// the first timer start (which is always a tap).
let audioCtx = null;
const ensureAudio = () => {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume();
  } catch {
    /* audio unsupported — chime silently skips */
  }
};

const playChime = () => {
  try {
    if (!audioCtx) return;
    const beep = (freq, at, dur = 0.18) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + dur + 0.05);
    };
    const now = audioCtx.currentTime;
    beep(880, now);
    beep(1320, now + 0.22);
  } catch {
    /* ignore */
  }
};

const buzz = () => {
  try {
    navigator.vibrate?.([180, 80, 180]);
  } catch {
    /* ignore */
  }
};

// ---------- screen wake lock ----------
// Keeps the screen on while a set timer or rest countdown runs — phones at
// the gym otherwise dim mid-set. Re-acquires after tab switches.
let wakeLock = null;
let wantWake = false;

const acquireWake = async () => {
  try {
    if (!wantWake || wakeLock || !navigator.wakeLock) return;
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null; // denied (low battery etc.) — non-fatal
  }
};

const releaseWake = () => {
  wantWake = false;
  try {
    wakeLock?.release();
  } catch {
    /* ignore */
  }
  wakeLock = null;
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wantWake) acquireWake();
  });
}

// ---------- expiry watcher ----------
// One interval (only while timers exist) that fires the chime exactly when a
// rest hits zero, then removes it from state. Also manages the wake lock.
let watcher = null;

const syncWatcher = () => {
  const anyActive =
    Object.keys(state.sets).length > 0 || Object.keys(state.rests).length > 0;

  if (anyActive) {
    wantWake = true;
    acquireWake();
    if (!watcher) {
      watcher = setInterval(() => {
        const now = Date.now();
        let changed = false;
        for (const [id, r] of Object.entries(state.rests)) {
          if (now - r.startedAt >= r.duration * 1000) {
            delete state.rests[id];
            changed = true;
            playChime();
            buzz();
          }
        }
        if (changed) emit();
        if (
          Object.keys(state.sets).length === 0 &&
          Object.keys(state.rests).length === 0
        ) {
          clearInterval(watcher);
          watcher = null;
          releaseWake();
        }
      }, 250);
    }
  } else {
    if (watcher) {
      clearInterval(watcher);
      watcher = null;
    }
    releaseWake();
  }
};

export const startSet = (id) => {
  state.sets[id] = { startedAt: Date.now() };
  ensureAudio();
  syncWatcher();
  emit();
};
export const stopSet = (id) => {
  const s = state.sets[id];
  if (!s) return 0;
  const elapsed = Math.floor((Date.now() - s.startedAt) / 1000);
  delete state.sets[id];
  syncWatcher();
  emit();
  return elapsed;
};
export const getSetElapsed = (id) => {
  const s = state.sets[id];
  if (!s) return 0;
  return Math.floor((Date.now() - s.startedAt) / 1000);
};
export const isSetRunning = (id) => !!state.sets[id];

export const startRest = (id, duration, meta = {}) => {
  state.rests[id] = { startedAt: Date.now(), duration, ...meta };
  ensureAudio();
  syncWatcher();
  emit();
};
export const stopRest = (id) => {
  delete state.rests[id];
  syncWatcher();
  emit();
};
export const getRestRemaining = (id) => {
  const r = state.rests[id];
  if (!r) return { remaining: 0, total: 0, active: false };
  const elapsed = (Date.now() - r.startedAt) / 1000;
  const remaining = Math.max(0, r.duration - elapsed);
  return { remaining, total: r.duration, active: remaining > 0 };
};

// Most recently started rest that is still active. Returns { id, remaining, total }
// or null. Used by the sticky session-level rest panel.
export const getActiveRest = () => {
  let best = null;
  for (const [id, r] of Object.entries(state.rests)) {
    const remaining = r.duration - (Date.now() - r.startedAt) / 1000;
    if (remaining <= 0) continue;
    if (!best || r.startedAt > best.startedAt) {
      best = {
        id,
        startedAt: r.startedAt,
        remaining,
        total: r.duration,
        nextSet: r.nextSet,
        exerciseName: r.exerciseName,
        kind: r.kind,
      };
    }
  }
  return best;
};

export function useTimerStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
}

export function useAnyActive() {
  const [any, setAny] = useState(false);
  useEffect(() => {
    let id;
    const check = () => {
      const hasSet = Object.keys(state.sets).length > 0;
      const hasRest = Object.values(state.rests).some((r) => {
        const remaining = r.duration - (Date.now() - r.startedAt) / 1000;
        return remaining > 0;
      });
      setAny(hasSet || hasRest);
    };
    id = setInterval(check, 500);
    check();
    return () => clearInterval(id);
  }, []);
  return any;
}

// convenience: subscribe to tick every N ms
export function useRefresh(ms = 250) {
  const [, setTick] = useState(0);
  const ref = useRef();
  useEffect(() => {
    ref.current = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(ref.current);
  }, [ms]);
}
