// Authentic Sound & Music Engine for FIGHT KARO (Sansad Showdown)
// Uses authentic game audio assets from fightkaro.com with procedural Web Audio fallback

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bufferCache = new Map();
    this.currentBgmSource = null;
    this.currentLoopSource = null;
    this.bgmPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Pause/resume everything when the app goes to the background.
  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) this.ctx.resume().catch(() => {});
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }

  // --- Audio File Loader & Playback ---
  async loadBuffer(name) {
    if (this.bufferCache.has(name)) {
      return this.bufferCache.get(name);
    }
    try {
      const res = await fetch(`./audio/${name}.mp3`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
      this.bufferCache.set(name, audioBuf);
      return audioBuf;
    } catch (e) {
      // console.warn(`Failed loading audio ./audio/${name}.mp3:`, e);
      return null;
    }
  }

  async playClip(name, volume = 1.0, loop = false, rate = 1.0) {
    if (this.isMuted) return null;
    this.init();
    try {
      const buf = await this.loadBuffer(name);
      if (!buf) return null;

      const source = this.ctx.createBufferSource();
      source.buffer = buf;
      source.loop = loop;
      source.playbackRate.value = rate;

      const gain = this.ctx.createGain();
      gain.gain.value = volume;

      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);

      return { source, gain };
    } catch (e) {
      return null;
    }
  }

  // --- Voice Announcer ---
  announce(name) {
    const mapping = {
      round_1: 'round_1',
      round_2: 'round_2',
      final_round: 'final_round',
      fight: 'fight',
      ko: 'ko',
      time_up: 'time_up',
      perfect: 'perfect',
      you_win: 'you_win',
      you_lose: 'you_lose'
    };
    const clip = mapping[name] || name;
    this.playClip(clip, 1.2).then(res => {
      if (!res) {
        // Fallback to gong if clip fails
        if (name.startsWith('round')) this.playRoundGong();
      }
    });
  }

  // --- Character Specific Battle Cries ---
  playCharacterVoice(charId) {
    const voices = {
      modi: 'modi',
      mitraman: 'modi',
      rahul: 'rahul',
      yatraboy: 'rahul',
      didi: 'didi',
      deedee: 'didi',
      trump: 'trump',
      taruftaau: 'trump',
      yogi: 'yogi',
      dozerdada: 'yogi',
      nitin: 'nitin',
      tollman: 'nitin',
      mbapu: 'mbapu',
      kejriwal: 'aloolelo'
    };
    const clip = voices[charId] || 'modi';
    this.playClip(clip, 1.15);
  }

  // --- Environmental & Event SFX ---
  playMoo() {
    this.playClip('moo', 1.3);
  }

  playCowBell() {
    this.playClip('cow_bell', 1.0);
  }

  playChaiTing() {
    this.playClip('chai_ting', 1.1);
  }

  playCupBreak() {
    this.playClip('cup_break', 1.2);
  }

  playCameraClicks() {
    this.playClip('camera_clicks', 0.9);
  }

  playNewsSting() {
    this.playClip('news_sting', 1.0);
  }

  playCoins() {
    this.playClip('coins', 1.0);
  }

  playKaching() {
    this.playClip('kaching', 1.1);
  }

  playHorn() {
    this.playClip('horn_long', 1.2);
  }

  // --- Combat SFX (Exact Fight Karo Audio Engine) ---
  playWhoosh() {
    const rate = 0.95 + Math.random() * 0.1;
    this.playClip('whoosh', 0.9, false, rate);
  }

  playHit(strength = 0.5) {
    const s = typeof strength === 'boolean' ? (strength ? 1.15 : 0.5) : strength;
    const [clip, ref] = s < 0.62 ? ['hit_1', 0.4] : s < 1.07 ? ['hit_2', 0.85] : ['hit_3', 1.3];
    const gain = Math.min(1.4, (0.6 + s * 0.3) / (0.6 + ref * 0.3));
    const rate = 0.96 + Math.random() * 0.08;
    this.playClip(clip, gain, false, rate);
  }

  playBlock() {
    const rate = 0.96 + Math.random() * 0.08;
    this.playClip('block', 0.95, false, rate);
  }

  playThud() {
    const rate = 0.95 + Math.random() * 0.1;
    this.playClip('thud', 1.05, false, rate);
  }

  playSlap() {
    this.playClip('slap', 1.0);
  }

  playSnap() {
    this.playClip('snap', 1.0);
  }

  playPlop() {
    this.playClip('plop', 1.0);
  }

  playFrog() {
    this.playClip('frog', 1.15);
  }

  playUITap() {
    this.playClip('ui_tap', 0.85);
  }

  playUIBack() {
    this.playClip('ui_back', 0.9);
  }

  playRoundGong() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(220, now);
    osc2.frequency.setValueAtTime(330, now);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.2);
    osc2.stop(now + 2.2);
  }

  playKO() {
    this.announce('ko');
    this.playClip('metal_crunch', 1.0);
    this.playClip('jingle_win', 0.9);
  }

  playSuperCharge(type = 'chakra') {
    if (type === 'chakra') {
      this.playClip('charge_chakra', 1.2);
      this.playClip('bed_chakra', 0.8);
    } else if (type === 'bulldozer') {
      this.playClip('engine_loop', 1.1);
      this.playClip('bed_bulldozer', 0.8);
    } else if (type === 'tariff_wall') {
      this.playClip('bed_tariff', 1.0);
    } else if (type === 'gold_machine') {
      this.playClip('aloolelo', 1.2);
    } else {
      this.playClip('charge_chakra', 1.0);
    }
  }

  playSuperExplosion(type = 'chakra') {
    if (type === 'chakra') {
      this.playClip('release_chakra', 1.3);
      this.playClip('boom', 1.2);
    } else if (type === 'bulldozer') {
      this.playClip('release_bulldozer', 1.3);
      this.playClip('crate_crash', 1.2);
    } else if (type === 'tariff_wall') {
      this.playClip('release_tariff', 1.2);
      this.playClip('stamp_slam', 1.3);
    } else if (type === 'gold_machine') {
      this.playClip('coins', 1.2);
      this.playClip('kaching', 1.3);
    } else if (type === 'khela_hobe') {
      this.playClip('thunder', 1.3);
      this.playClip('boom', 1.1);
    } else {
      this.playClip('boom', 1.3);
    }
  }

  playUISelect() {
    this.playClip('ui_select', 0.8);
  }

  playUIConfirm() {
    this.playClip('ui_confirm', 0.9);
  }

  // --- Background Music ---
  async startBGM() {
    if (this.isMuted || this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;

    // Try playing authentic battle.mp3
    const res = await this.playClip('battle', 0.55, true);
    if (res) {
      this.currentBgmSource = res.source;
    } else {
      this.startProceduralBGM();
    }
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.currentBgmSource) {
      try {
        this.currentBgmSource.stop();
      } catch (e) {}
      this.currentBgmSource = null;
    }
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // Procedural 80s arcade synth + Dhol beat fallback
  startProceduralBGM() {
    const tempo = 128;
    const stepDuration = 60 / tempo / 4;
    const bassline = [110, 110, 130, 110, 146, 130, 110, 98];
    let step = 0;

    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.bgmPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Bass note
      if (step % 2 === 0) {
        const bassFreq = bassline[Math.floor(step / 2) % bassline.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      }

      // Dhol Kick on beat 0 and 8
      if (step % 8 === 0) {
        const kick = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(130, now);
        kick.frequency.exponentialRampToValueAtTime(42, now + 0.16);
        kGain.gain.setValueAtTime(0.4, now);
        kGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        kick.connect(kGain);
        kGain.connect(this.ctx.destination);
        kick.start(now);
        kick.stop(now + 0.16);
      }

      step = (step + 1) % 32;
    }, stepDuration * 1000);
  }
}

export const sound = new SoundEngine();
