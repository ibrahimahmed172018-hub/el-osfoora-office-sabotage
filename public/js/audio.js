/**
 * audio.js — Egyptian Slang Web Audio API Synthesizer & Speech Engine
 * توليد مؤثرات صوتية مصرية تفاعلية بالكامل بدون أي اعتماديات خارجية
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play Simple Tone
  playTone(freq, type = 'sine', duration = 0.15, gain = 0.2) {
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(g);
    g.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Emergency Siren (اجتماع طوارئ)
  playEmergencyAlarm() {
    this.ensureContext();
    if (!this.ctx) return;

    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      
      const startTime = this.ctx.currentTime + (i * 0.4);
      osc.frequency.setValueAtTime(440, startTime);
      osc.frequency.linearRampToValueAtTime(880, startTime + 0.2);
      osc.frequency.linearRampToValueAtTime(440, startTime + 0.4);

      g.gain.setValueAtTime(0.3, startTime);
      g.gain.linearRampToValueAtTime(0.01, startTime + 0.4);

      osc.connect(g);
      g.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    }
    this.speakEgyptianBark('اجتماع طوارئ مفاجئ! تعالوا على الروم بسرعة!');
  }

  // Body Found / Report Alarm (الحقوا ده في مصيبة هنا!)
  playReportAlarm() {
    this.ensureContext();
    if (!this.ctx) return;

    this.playTone(300, 'square', 0.2, 0.4);
    setTimeout(() => this.playTone(600, 'square', 0.4, 0.4), 200);
    this.speakEgyptianBark('الحقوا ده في مصيبة هنا! موظف اتشحور!');
  }

  // Elimination / Kill Character-specific Sounds
  playKillSound(characterId) {
    this.ensureContext();
    if (!this.ctx) return;

    switch (characterId) {
      case 'bashmohandes': // Debug Beam (ليزر كود)
        for (let i = 0; i < 5; i++) {
          setTimeout(() => this.playTone(900 - (i * 120), 'sawtooth', 0.08, 0.3), i * 50);
        }
        break;

      case 'pablo': // Belly Bump (خبطة بالكرش)
        this.playTone(80, 'sine', 0.5, 0.6); // Deep thud
        setTimeout(() => this.playTone(120, 'triangle', 0.3, 0.4), 100);
        break;

      case 'samaool': // Design Kick (شوطة الموزة)
        this.playTone(600, 'sine', 0.1, 0.3);
        setTimeout(() => this.playTone(250, 'sawtooth', 0.3, 0.4), 80);
        break;

      case 'musa': // Advertising Blitz (زقة غشيمة 2x)
        this.playTone(90, 'square', 0.4, 0.5);
        setTimeout(() => this.playTone(60, 'sine', 0.6, 0.7), 100);
        break;

      case 'abdelmonem': // Pixel Dash (جريت بكسلات البرق)
        for (let i = 0; i < 6; i++) {
          setTimeout(() => this.playTone(1200 + (i * 150), 'square', 0.04, 0.25), i * 30);
        }
        break;

      case 'shatlawi': // Timeline Slice (قص التايم لاين)
        this.playTone(1500, 'sawtooth', 0.06, 0.4);
        setTimeout(() => this.playTone(1800, 'sawtooth', 0.08, 0.4), 60);
        break;

      default:
        this.playTone(150, 'sawtooth', 0.3, 0.4);
    }
  }

  // Task Completion Chime (إنجاز تاسك ديدلاين)
  playTaskSuccess() {
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.12, 0.25), idx * 70);
    });
  }

  // Task Fail / Error
  playTaskFail() {
    this.ensureContext();
    if (!this.ctx) return;
    this.playTone(180, 'sawtooth', 0.2, 0.3);
    setTimeout(() => this.playTone(140, 'sawtooth', 0.3, 0.3), 150);
  }

  // Penalty Buzzer & Lock Sound (صوت الغرامة وتجميد التاسك)
  playPenaltySound() {
    this.ensureContext();
    if (!this.ctx) return;
    // Dissonant sharp buzz
    this.playTone(110, 'sawtooth', 0.35, 0.45);
    setTimeout(() => this.playTone(95, 'sawtooth', 0.45, 0.5), 100);
  }

  // Steam / Boiling Sound (بخار القهوة)
  playSteamSound() {
    this.ensureContext();
    if (!this.ctx) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.playTone(200 + Math.random() * 100, 'sine', 0.25, 0.15), i * 80);
    }
  }

  // Laser Scan Sound (ليزر كارت البصمة)
  playLaserSound() {
    this.ensureContext();
    if (!this.ctx) return;
    this.playTone(1200, 'sine', 0.05, 0.3);
    setTimeout(() => this.playTone(1600, 'sine', 0.08, 0.3), 60);
    setTimeout(() => this.playTone(2000, 'sine', 0.1, 0.25), 120);
  }

  // Dual Key Sync Surge (تزامن القاطع المزدوج والصاعقة)
  playDualKeySyncSound() {
    this.ensureContext();
    if (!this.ctx) return;
    // Ascending power build-up
    const notes = [300, 450, 600, 750, 950, 1200];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.1, 0.3), idx * 60);
    });
    // Massive triumph chord
    setTimeout(() => {
      this.playTone(523.25, 'triangle', 0.6, 0.4);
      this.playTone(659.25, 'triangle', 0.6, 0.4);
      this.playTone(783.99, 'triangle', 0.6, 0.4);
      this.playTone(1046.50, 'triangle', 0.6, 0.4);
    }, 400);
  }

  // Coin / Currency Count
  playCoinClink() {
    this.ensureContext();
    if (!this.ctx) return;
    this.playTone(1400 + Math.random() * 200, 'triangle', 0.08, 0.2);
  }

  // Plug pull / push
  playPlugSound() {
    this.ensureContext();
    if (!this.ctx) return;
    this.playTone(280, 'square', 0.1, 0.2);
  }

  // Vote Cast
  playVoteCast() {
    this.ensureContext();
    if (!this.ctx) return;
    this.playTone(480, 'sine', 0.1, 0.3);
    setTimeout(() => this.playTone(680, 'sine', 0.15, 0.3), 80);
  }

  // Ejection Stamp
  playEjectionSound(wasSaboteur) {
    this.ensureContext();
    if (!this.ctx) return;
    this.playTone(120, 'sawtooth', 0.5, 0.5);
    setTimeout(() => {
      if (wasSaboteur) {
        this.playTaskSuccess();
      } else {
        this.playTaskFail();
      }
    }, 400);
  }

  // Victory Fanfare (الشركة سلمت البروجكت والعميل دفع!)
  playVictory() {
    this.ensureContext();
    if (!this.ctx) return;
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.35, 0.3), i * 120);
    });
    this.speakEgyptianBark('الشركة سلمت البروجكت والعميل دفع! مبروك يا شباب!');
  }

  // Defeat (الشركة فلست والمخرّب ضحك عليكم!)
  playDefeat() {
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [400, 370, 340, 280];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.4, 0.3), i * 200);
    });
    this.speakEgyptianBark('الشركة فلست والمخرّب ضحك عليكم!');
  }

  // Egyptian Voice Speech Barks (Web Speech API)
  speakEgyptianBark(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-EG';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log('Speech synthesis skipped:', e);
    }
  }
}

window.soundEngine = new SoundEngine();
