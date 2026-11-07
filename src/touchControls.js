// On-screen touch controls. They dispatch synthetic keyboard events so the
// existing keyboard handling in main.js works unchanged.
// Only shown on touch-first devices (phones/tablets).

const KEYS = {
  left:  { key: 'a', code: 'KeyA' },
  right: { key: 'd', code: 'KeyD' },
  up:    { key: 'w', code: 'KeyW' },
  down:  { key: 's', code: 'KeyS' },
  punch: { key: 'j', code: 'KeyJ' },
  kick:  { key: 'k', code: 'KeyK' },
  super: { key: ' ', code: 'Space' },
  pause: { key: 'Escape', code: 'Escape' },
};

function fire(type, spec) {
  window.dispatchEvent(new KeyboardEvent(type, { key: spec.key, code: spec.code, bubbles: true }));
}

function makeButton(name, label, cls) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `tc-btn ${cls || ''}`;
  b.dataset.action = name;
  b.textContent = label;
  b.setAttribute('aria-label', name);
  return b;
}

export function initTouchControls() {
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!isTouch) return;

  document.body.classList.add('touch-device');

  const root = document.createElement('div');
  root.id = 'touch-controls';

  const dpad = document.createElement('div');
  dpad.className = 'tc-dpad';
  dpad.append(
    makeButton('up', '▲', 'tc-up'),
    makeButton('left', '◀', 'tc-left'),
    makeButton('right', '▶', 'tc-right'),
    makeButton('down', '▼', 'tc-down'),
  );

  const actions = document.createElement('div');
  actions.className = 'tc-actions';
  actions.append(
    makeButton('punch', 'PUNCH', 'tc-punch'),
    makeButton('kick', 'KICK', 'tc-kick'),
    makeButton('super', 'SUPER', 'tc-super'),
  );

  const pause = makeButton('pause', '❚❚', 'tc-pause');

  root.append(dpad, actions, pause);
  document.body.appendChild(root);

  // Track which pointer is holding which button so multi-touch works.
  const held = new Map(); // pointerId -> action

  const press = (action) => fire('keydown', KEYS[action]);
  const release = (action) => fire('keyup', KEYS[action]);

  root.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.tc-btn');
    if (!btn) return;
    e.preventDefault();
    const action = btn.dataset.action;
    held.set(e.pointerId, { action, btn });
    btn.classList.add('down');
    btn.setPointerCapture?.(e.pointerId);
    press(action);
  });

  const end = (e) => {
    const h = held.get(e.pointerId);
    if (!h) return;
    held.delete(e.pointerId);
    h.btn.classList.remove('down');
    release(h.action);
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);

  // Never leave a key stuck if the app is backgrounded mid-press.
  window.addEventListener('blur', () => {
    for (const [id, h] of held) {
      h.btn.classList.remove('down');
      release(h.action);
      held.delete(id);
    }
  });

  root.addEventListener('contextmenu', (e) => e.preventDefault());

  // Show the controls only while a fight is on screen. The game container is
  // always present, so key off the HUD's visibility via a light poll.
  const update = () => {
    const app = window.app;
    const fighting = app && (app.gameState === 'FIGHTING' || app.gameState === 'PAUSED');
    root.classList.toggle('active', !!fighting);
  };
  setInterval(update, 250);
  update();
}
