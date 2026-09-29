import { AudioSettings, MemeSound, SynthRecipe } from '../types/soundboard';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private boosterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Microphone passthrough
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private isMicActive: boolean = false;

  // Active audio elements and sources
  private activeSources: { id: string; stop: () => void }[] = [];
  private onPlayStateChange?: (playingId: string | null) => void;

  public settings: AudioSettings = {
    masterVolume: 0.9,
    loudBooster: true,
    voiceFilter: 'none',
    micEnabled: false,
    micVolume: 1.0,
    micNoiseGate: false,
    duckMicOnSound: true,
  };

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master chain: [Booster] -> [Filter] -> [Compressor] -> [MasterGain] -> [Analyser] -> [Destination]
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.boosterGain = this.ctx.createGain();
      this.boosterGain.gain.setValueAtTime(this.settings.loudBooster ? 2.2 : 1.0, this.ctx.currentTime);

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'allpass';

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      // Connect master chain
      this.boosterGain.connect(this.filterNode);
      this.filterNode.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public setOnPlayStateChange(cb: (playingId: string | null) => void) {
    this.onPlayStateChange = cb;
  }

  public updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (!this.ctx) return;

    if (this.masterGain && newSettings.masterVolume !== undefined) {
      this.masterGain.gain.setTargetAtTime(newSettings.masterVolume, this.ctx.currentTime, 0.05);
    }

    if (this.boosterGain && newSettings.loudBooster !== undefined) {
      const boostVal = newSettings.loudBooster ? 2.2 : 1.0;
      this.boosterGain.gain.setTargetAtTime(boostVal, this.ctx.currentTime, 0.05);
    }

    if (this.filterNode && newSettings.voiceFilter !== undefined) {
      if (newSettings.voiceFilter === 'radio') {
        this.filterNode.type = 'bandpass';
        this.filterNode.frequency.setTargetAtTime(1800, this.ctx.currentTime, 0.05);
        this.filterNode.Q.setTargetAtTime(2.5, this.ctx.currentTime, 0.05);
      } else if (newSettings.voiceFilter === 'megaphone') {
        this.filterNode.type = 'peaking';
        this.filterNode.frequency.setTargetAtTime(1200, this.ctx.currentTime, 0.05);
        this.filterNode.gain.setTargetAtTime(8, this.ctx.currentTime, 0.05);
      } else if (newSettings.voiceFilter === 'bassboost') {
        this.filterNode.type = 'lowshelf';
        this.filterNode.frequency.setTargetAtTime(250, this.ctx.currentTime, 0.05);
        this.filterNode.gain.setTargetAtTime(10, this.ctx.currentTime, 0.05);
      } else {
        this.filterNode.type = 'allpass';
      }
    }

    if (this.micGain && newSettings.micVolume !== undefined) {
      this.micGain.gain.setTargetAtTime(newSettings.micVolume, this.ctx.currentTime, 0.05);
    }
  }

  // Live Microphone Passthrough setup
  public async toggleMicrophone(enabled: boolean): Promise<boolean> {
    const ctx = this.init();
    if (!enabled) {
      if (this.micStream) {
        this.micStream.getTracks().forEach((t) => t.stop());
        this.micStream = null;
      }
      if (this.micSource) {
        this.micSource.disconnect();
        this.micSource = null;
      }
      this.isMicActive = false;
      this.settings.micEnabled = false;
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.micStream = stream;
      this.micSource = ctx.createMediaStreamSource(stream);
      this.micGain = ctx.createGain();
      this.micGain.gain.setValueAtTime(this.settings.micVolume, ctx.currentTime);

      this.micAnalyser = ctx.createAnalyser();
      this.micAnalyser.fftSize = 32;

      this.micSource.connect(this.micGain);
      this.micGain.connect(this.micAnalyser);
      // Route to master chain so gamer voice goes through to team/headphones
      this.micGain.connect(this.boosterGain!);

      this.isMicActive = true;
      this.settings.micEnabled = true;
      return true;
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      this.isMicActive = false;
      this.settings.micEnabled = false;
      throw err;
    }
  }

  public getIsMicActive(): boolean {
    return this.isMicActive;
  }

  public getMicLevel(): number {
    if (!this.micAnalyser || !this.isMicActive) return 0;
    const data = new Uint8Array(this.micAnalyser.frequencyBinCount);
    this.micAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return Math.min(100, Math.round((sum / data.length / 255) * 100));
  }

  public getSoundWaveData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(32);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  private duckMic(duck: boolean) {
    if (!this.micGain || !this.ctx || !this.settings.duckMicOnSound) return;
    const target = duck ? this.settings.micVolume * 0.15 : this.settings.micVolume;
    this.micGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }

  // Play a meme sound
  public async playSound(meme: MemeSound): Promise<void> {
    const ctx = this.init();
    this.stopAll();

    this.duckMic(true);
    if (this.onPlayStateChange) this.onPlayStateChange(meme.id);

    const onFinished = () => {
      this.duckMic(false);
      this.activeSources = this.activeSources.filter((s) => s.id !== meme.id);
      if (this.activeSources.length === 0 && this.onPlayStateChange) {
        this.onPlayStateChange(null);
      }
    };

    // 1. If custom audio blob/URI exists
    if (meme.audioDataUri || meme.audioBlobUrl) {
      const src = meme.audioDataUri || meme.audioBlobUrl;
      const audio = new Audio(src);
      audio.crossOrigin = 'anonymous';

      const audioSource = ctx.createMediaElementSource(audio);
      audioSource.connect(this.boosterGain!);

      audio.onended = () => {
        audioSource.disconnect();
        onFinished();
      };
      audio.onerror = () => {
        onFinished();
      };

      this.activeSources.push({
        id: meme.id,
        stop: () => {
          audio.pause();
          audio.currentTime = 0;
          audioSource.disconnect();
          onFinished();
        },
      });

      try {
        await audio.play();
      } catch (err) {
        console.warn('Audio element play failed, falling back to synth', err);
        this.playSynthesizedSound(meme, onFinished);
      }
      return;
    }

    // 2. Synthesized Sound / Speech
    this.playSynthesizedSound(meme, onFinished);
  }

  private playSynthesizedSound(meme: MemeSound, onFinished: () => void) {
    const ctx = this.init();

    if (meme.synthRecipe) {
      this.executeSynthRecipe(meme.synthRecipe, meme.id, onFinished);
    } else if (meme.speechText) {
      this.speakText(meme.speechText, meme, onFinished);
    } else {
      // Default chirp/drop
      this.playToneBeep(ctx, meme.id, onFinished);
    }
  }

  private executeSynthRecipe(recipe: SynthRecipe, id: string, onFinished: () => void) {
    const ctx = this.init();

    if (recipe.type === 'melody') {
      this.playMelody(recipe.song, id, onFinished);
    } else if (recipe.type === 'siren_run') {
      this.playSiren(id, onFinished);
    } else if (recipe.type === 'airhorn') {
      this.playAirhorn(id, onFinished);
    } else if (recipe.type === 'booyah_headshot') {
      this.playBooyah(id, onFinished);
    } else if (recipe.type === 'emotional_damage') {
      this.playEmotionalDamage(id, onFinished);
    } else if (recipe.type === 'wheeze_laugh') {
      this.playWheezeLaugh(id, onFinished);
    } else if (recipe.type === 'radio_speaker') {
      this.playSpeakerAnnouncement(recipe.voiceText, id, onFinished);
    } else if (recipe.type === 'voice_fx') {
      this.playVoiceFx(recipe.voiceText, recipe.pitch, recipe.rate, recipe.fx, id, onFinished);
    }
  }

  // High quality Web Audio procedural sound generators

  private playMelody(song: 'royalty' | 'fairytale' | 'moye_moye', id: string, onFinished: () => void) {
    const ctx = this.init();
    const now = ctx.currentTime;
    let notes: { freq: number; dur: number; time: number }[] = [];

    if (song === 'moye_moye') {
      // "Moye More Moye More" melody in E minor
      // E4 (329.63), G4 (392.00), F#4 (369.99), E4 (329.63), B3 (246.94)
      notes = [
        { freq: 329.63, dur: 0.35, time: 0 },
        { freq: 392.00, dur: 0.35, time: 0.35 },
        { freq: 369.99, dur: 0.45, time: 0.70 },
        { freq: 329.63, dur: 0.60, time: 1.15 },
        // "Moye More"
        { freq: 329.63, dur: 0.35, time: 1.85 },
        { freq: 392.00, dur: 0.35, time: 2.20 },
        { freq: 369.99, dur: 0.50, time: 2.55 },
        { freq: 293.66, dur: 0.80, time: 3.10 },
      ];
    } else if (song === 'royalty') {
      // Punchy brass drop hook ("Calling me royalty")
      notes = [
        { freq: 174.61, dur: 0.18, time: 0 }, // F3
        { freq: 174.61, dur: 0.18, time: 0.2 },
        { freq: 207.65, dur: 0.18, time: 0.4 }, // G#3
        { freq: 233.08, dur: 0.28, time: 0.6 }, // Bb3
        { freq: 261.63, dur: 0.40, time: 0.9 }, // C4
        { freq: 207.65, dur: 0.35, time: 1.35 },
        { freq: 233.08, dur: 0.60, time: 1.75 },
      ];
    } else if (song === 'fairytale') {
      // Alexander Rybak energetic violin motif
      notes = [
        { freq: 440.00, dur: 0.15, time: 0 }, // A4
        { freq: 523.25, dur: 0.15, time: 0.16 }, // C5
        { freq: 587.33, dur: 0.15, time: 0.32 }, // D5
        { freq: 659.25, dur: 0.30, time: 0.48 }, // E5
        { freq: 587.33, dur: 0.15, time: 0.80 }, // D5
        { freq: 523.25, dur: 0.15, time: 0.96 }, // C5
        { freq: 440.00, dur: 0.35, time: 1.12 }, // A4
        { freq: 392.00, dur: 0.20, time: 1.50 }, // G4
        { freq: 440.00, dur: 0.60, time: 1.72 }, // A4
      ];
    }

    const oscs: OscillatorNode[] = [];
    const totalDuration = notes[notes.length - 1].time + notes[notes.length - 1].dur + 0.5;

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = song === 'fairytale' ? 'sawtooth' : song === 'royalty' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0, now + n.time);
      gain.gain.linearRampToValueAtTime(0.4, now + n.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.boosterGain!);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
      oscs.push(osc);
    });

    const stopTimer = setTimeout(() => {
      onFinished();
    }, totalDuration * 1000);

    this.activeSources.push({
      id,
      stop: () => {
        clearTimeout(stopTimer);
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {
            // ignore
          }
        });
        onFinished();
      },
    });
  }

  private playAirhorn(id: string, onFinished: () => void) {
    const ctx = this.init();
    const now = ctx.currentTime;
    const hornPitches = [466.16, 466.16, 466.16, 466.16, 622.25]; // Bb4 blasts + High Eb5
    const timings = [0, 0.14, 0.28, 0.42, 0.60];
    const durations = [0.10, 0.10, 0.10, 0.12, 0.55];

    const oscs: OscillatorNode[] = [];

    for (let i = 0; i < hornPitches.length; i++) {
      const t = now + timings[i];
      const dur = durations[i];

      // Multi-saw oscillator cluster for brass sound
      [-2, 0, 3].forEach((detune) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(hornPitches[i], t);
        osc.detune.setValueAtTime(detune * 4, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(this.boosterGain!);

        osc.start(t);
        osc.stop(t + dur);
        oscs.push(osc);
      });
    }

    const timer = setTimeout(() => onFinished(), 1400);
    this.activeSources.push({
      id,
      stop: () => {
        clearTimeout(timer);
        oscs.forEach((o) => {
          try { o.stop(); } catch {}
        });
        onFinished();
      },
    });
  }

  private playSiren(id: string, onFinished: () => void) {
    const ctx = this.init();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    // Pitch sweep up and down
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.35);
    osc.frequency.linearRampToValueAtTime(450, now + 0.7);
    osc.frequency.linearRampToValueAtTime(950, now + 1.05);
    osc.frequency.linearRampToValueAtTime(300, now + 1.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(gain);
    gain.connect(this.boosterGain!);

    osc.start(now);
    osc.stop(now + 1.5);

    // Deep sub drop at end
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now + 0.6);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 1.4);
    subGain.gain.setValueAtTime(0.4, now + 0.6);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    subOsc.connect(subGain);
    subGain.connect(this.boosterGain!);
    subOsc.start(now + 0.6);
    subOsc.stop(now + 1.5);

    const timer = setTimeout(() => onFinished(), 1600);
    this.activeSources.push({
      id,
      stop: () => {
        clearTimeout(timer);
        try { osc.stop(); subOsc.stop(); } catch {}
        onFinished();
      },
    });
  }

  private playBooyah(id: string, onFinished: () => void) {
    const ctx = this.init();
    const now = ctx.currentTime;

    // Orchestral hit chord (C minor)
    [130.81, 155.56, 196.00, 261.63, 311.13, 392.00].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.boosterGain!);

      osc.start(now);
      osc.stop(now + 1.8);
    });

    // Voice announcement
    setTimeout(() => {
      this.speakText('BOOYAH! HEADSHOT!', { speechPitch: 0.9, speechRate: 1.1 } as MemeSound, onFinished);
    }, 200);
  }

  private playEmotionalDamage(id: string, onFinished: () => void) {
    const ctx = this.init();
    const now = ctx.currentTime;

    // Dramatic sting chord
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.6);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.boosterGain!);

    osc.start(now);
    osc.stop(now + 0.6);

    this.speakText('Emotional Damage!', { speechPitch: 1.15, speechRate: 1.05 } as MemeSound, onFinished);
  }

  private playWheezeLaugh(id: string, onFinished: () => void) {
    const ctx = this.init();
    const now = ctx.currentTime;

    // Modulated hilarious wheeze tone
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, now);

    lfo.type = 'sawtooth';
    lfo.frequency.setValueAtTime(7, now); // 7 laughs per sec
    lfoGain.gain.setValueAtTime(140, now);

    lfo.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(this.boosterGain!);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 2.0);
    osc.stop(now + 2.0);

    const timer = setTimeout(() => onFinished(), 2100);
    this.activeSources.push({
      id,
      stop: () => {
        clearTimeout(timer);
        try { osc.stop(); lfo.stop(); } catch {}
        onFinished();
      },
    });
  }

  private playSpeakerAnnouncement(text: string, id: string, onFinished: () => void) {
    const ctx = this.init();
    const now = ctx.currentTime;

    // Megaphone / cart speaker horn click
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(800, now);
    clickGain.gain.setValueAtTime(0.15, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    click.connect(clickGain);
    clickGain.connect(this.boosterGain!);
    click.start(now);
    click.stop(now + 0.08);

    // Speak with megaphone pitch and cadence
    this.speakText(text, { speechPitch: 1.3, speechRate: 1.05 } as MemeSound, onFinished);
  }

  private playVoiceFx(text: string, pitch: number, rate: number, _fx: string | undefined, id: string, onFinished: () => void) {
    this.speakText(text, { id, speechPitch: pitch, speechRate: rate } as MemeSound, onFinished);
  }

  private playToneBeep(ctx: AudioContext, id: string, onFinished: () => void) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.35);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.boosterGain!);
    osc.start(now);
    osc.stop(now + 0.35);
    setTimeout(onFinished, 400);
  }

  // Web Speech API integration
  private speakText(text: string, meme: Partial<MemeSound>, onFinished: () => void) {
    if (!('speechSynthesis' in window)) {
      setTimeout(onFinished, 1000);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Try finding Sinhala or Indian English voice for authentic accent
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes('si') || v.name.toLowerCase().includes('sinhala')) ||
      voices.find((v) => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india')) ||
      voices.find((v) => v.lang.includes('en-GB') || v.lang.includes('en-US')) ||
      voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.pitch = meme.speechPitch ?? 1.0;
    utterance.rate = meme.speechRate ?? 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      onFinished();
    };

    utterance.onerror = () => {
      onFinished();
    };

    window.speechSynthesis.speak(utterance);

    this.activeSources.push({
      id: meme.id || 'speech',
      stop: () => {
        window.speechSynthesis.cancel();
        onFinished();
      },
    });
  }

  public stopAll(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.activeSources.forEach((s) => {
      try {
        s.stop();
      } catch {
        // ignore
      }
    });
    this.activeSources = [];
    this.duckMic(false);
    if (this.onPlayStateChange) this.onPlayStateChange(null);
  }

  // Record audio from microphone into a data blob
  public recordAudioClip(): {
    start: () => Promise<void>;
    stop: () => Promise<Blob>;
  } {
    let mediaRecorder: MediaRecorder | null = null;
    let chunks: BlobPart[] = [];

    return {
      start: async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        mediaRecorder.start();
      },
      stop: () => {
        return new Promise<Blob>((resolve, reject) => {
          if (!mediaRecorder) return reject(new Error('Recorder not initialized'));
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            mediaRecorder?.stream.getTracks().forEach((t) => t.stop());
            resolve(blob);
          };
          mediaRecorder.stop();
        });
      },
    };
  }
}

export const audioEngine = new AudioEngine();
