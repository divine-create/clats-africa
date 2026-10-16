/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private lastTapTime: number = 0;

  private isSoundEnabled(): boolean {
    if (typeof window !== "undefined") {
      // Default to true if not explicitly set to false
      return (window as any).__CLATS_SOUND_ENABLED__ !== false;
    }
    return true;
  }

  playTap() {
    try {
      if (!this.isSoundEnabled()) return;
      if (Date.now() - this.lastTapTime < 50) return;
      this.lastTapTime = Date.now();
      
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Audio context might be blocked or unsupported in preview frame
    }
  }

  playCoin() {
    try {
      if (!this.isSoundEnabled()) return;
      const ctx = this.init();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5

      gain.gain.setValueAtTime(0.10, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.25);
    } catch (e) {
      // Ignored
    }
  }

  playBuzzer() {
    try {
      if (!this.isSoundEnabled()) return;
      const ctx = this.init();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.22);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {
      // Ignored
    }
  }

  playLevelUp() {
    try {
      if (!this.isSoundEnabled()) return;
      const ctx = this.init();
      const now = ctx.currentTime;

      const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch (e) {
      // Ignored
    }
  }

  playForestChime() {
    try {
      if (!this.isSoundEnabled()) return;
      const ctx = this.init();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Forest bells)
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.06, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.6);
      });
    } catch (e) {
      // Ignored
    }
  }

  playCosmicTone() {
    try {
      if (!this.isSoundEnabled()) return;
      const ctx = this.init();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.4); // E5 shimmer
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {
      // Ignored
    }
  }

  playCheer() {
    try {
      if (!this.isSoundEnabled()) return;
      const ctx = this.init();
      const now = ctx.currentTime;

      // 1. Celebratory Party Horn / Brass Fanfare (C5 -> E5 -> G5 -> C6 -> E6 + triumphant chord)
      const fanfare = [
        { freq: 523.25, start: 0.0, dur: 0.14 },  // C5
        { freq: 659.25, start: 0.11, dur: 0.14 }, // E5
        { freq: 783.99, start: 0.22, dur: 0.14 }, // G5
        { freq: 1046.50, start: 0.34, dur: 0.55 }, // C6
        { freq: 1318.51, start: 0.42, dur: 0.65 }  // E6
      ];
      fanfare.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        sub.type = "sine";
        osc.frequency.setValueAtTime(freq, now + start);
        sub.frequency.setValueAtTime(freq * 0.5, now + start);

        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.linearRampToValueAtTime(0.11, now + start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        sub.start(now + start);
        osc.stop(now + start + dur + 0.02);
        sub.stop(now + start + dur + 0.02);
      });

      // 2. Synthesized Crowd Cheer & Applause Swell (formant-filtered noise + rhythmic claps)
      const bufferDuration = 1.65;
      const sampleRate = ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * bufferDuration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink-ish warm noise shaping
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        // Add subtle applause modulation bursts
        const clapMod = 0.65 + 0.35 * Math.sin(i * 0.018) * Math.sin(i * 0.0043);
        data[i] = ((b0 + b1 + b2 + white * 0.18) * 0.12) * clapMod;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      // Vocal "Yay/Woo!" formant filters
      const formant1 = ctx.createBiquadFilter();
      formant1.type = "bandpass";
      formant1.frequency.setValueAtTime(750, now);
      formant1.frequency.linearRampToValueAtTime(1050, now + 0.5);
      formant1.Q.setValueAtTime(2.2, now);

      const formant2 = ctx.createBiquadFilter();
      formant2.type = "bandpass";
      formant2.frequency.setValueAtTime(1650, now);
      formant2.frequency.linearRampToValueAtTime(2150, now + 0.6);
      formant2.Q.setValueAtTime(2.5, now);

      const cheerGain = ctx.createGain();
      cheerGain.gain.setValueAtTime(0.001, now);
      cheerGain.gain.linearRampToValueAtTime(0.18, now + 0.22);
      cheerGain.gain.setValueAtTime(0.16, now + 0.75);
      cheerGain.gain.exponentialRampToValueAtTime(0.001, now + bufferDuration);

      noiseSource.connect(formant1);
      noiseSource.connect(formant2);
      formant1.connect(cheerGain);
      formant2.connect(cheerGain);
      cheerGain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + bufferDuration);
    } catch (e) {
      // Fallback to levelUp if buffer creation fails
      this.playLevelUp();
    }
  }

  play(type: string = "tap") {
    switch (type) {
      case "pop":
      case "tap":
        this.playTap();
        break;
      case "coin":
      case "success":
        this.playCoin();
        break;
      case "buzzer":
      case "error":
        this.playBuzzer();
        break;
      case "cheer":
        this.playCheer();
        break;
      case "levelup":
      case "reward":
      case "celebrate":
        this.playLevelUp();
        break;
      case "chime":
      case "forest":
        this.playForestChime();
        break;
      case "cosmic":
        this.playCosmicTone();
        break;
      default:
        this.playTap();
        break;
    }
  }

  playError() {
    this.playBuzzer();
  }

  playSuccess() {
    this.playCoin();
  }

  playReward() {
    this.playLevelUp();
  }
}

export interface CompanionConfig {
  id: string;
  companion_name: "kobe" | "chibi";
  voice_url: string;
  voice_mode: "Uploaded Voice" | "Browser TTS";
  speech_rate: number;
  speech_pitch: number;
  language: string;
  updated_at?: string;
}

class CompanionVoice {
  private activeAudio: HTMLAudioElement | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private TOGGLE_KEY = "clats_companion_narration_enabled_v2";
  private CACHE_KEY = "clats_companion_configs_cached_v3";

  configs: Record<"kobe" | "chibi", CompanionConfig> = {
    kobe: {
      id: "cfg-kobe",
      companion_name: "kobe",
      voice_url: "Kobe_Greeting_Intro_Nigeria.mp3",
      voice_mode: "Browser TTS",
      speech_rate: 1.0,
      speech_pitch: 1.0,
      language: "en-US"
    },
    chibi: {
      id: "cfg-chibi",
      companion_name: "chibi",
      voice_url: "Chibi_Bedtime_Story_Axe_Senegal.mp3",
      voice_mode: "Browser TTS",
      speech_rate: 1.0,
      speech_pitch: 1.0,
      language: "en-US"
    }
  };

  constructor() {
    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(this.CACHE_KEY);
        if (cached) {
          this.configs = JSON.parse(cached);
        }
      }
    } catch (e) {
      console.warn("Could not parse cached companion configurations", e);
    }
  }

  saveConfigsToCache() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.configs));
    } catch (e) {
      console.warn("Could not save configurations cache", e);
    }
  }

  // Load from database on startup
  async loadConfigsFromServer() {
    try {
      const res = await fetch("/api/supabase/companion_config");
      const json = await res.json();
      if (json && json.ok && Array.isArray(json.data) && json.data.length > 0) {
        json.data.forEach((row: any) => {
          const name = row.companion_name;
          if (name === "kobe" || name === "chibi") {
            this.configs[name] = {
              id: row.id || ("cfg-" + name),
              companion_name: name,
              voice_url: row.voice_url || "",
              voice_mode: (row.voice_mode === "Uploaded Voice" || row.voice_mode === "Browser TTS") ? row.voice_mode : "Browser TTS",
              speech_rate: Number(row.speech_rate) || 1.0,
              speech_pitch: Number(row.speech_pitch) || 1.0,
              language: row.language || "en-US",
              updated_at: row.updated_at
            };
          }
        });
        this.saveConfigsToCache();
        return true;
      }
    } catch (e) {
      console.warn("Error running companion_config load:", e);
    }
    return false;
  }

  // Save/Update config to server and cache
  async saveConfig(companion: "kobe" | "chibi", updates: Partial<CompanionConfig>) {
    this.configs[companion] = {
      ...this.configs[companion],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveConfigsToCache();

    try {
      const config = this.configs[companion];
      const res = await fetch("/api/supabase/companion_config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const json = await res.json();
      return json.ok;
    } catch (e) {
      console.warn("Error running companion_config save to database:", e);
      return false;
    }
  }

  // Check if narration is enabled for a given age group (default ON so voice sounds immediately in sync)
  isNarrationEnabled(ageGroup: string): boolean {
    if (typeof window === "undefined") return true;
    const ag = (ageGroup || "").toLowerCase();
    const isYoungExplorer = ag.includes("early") || ag.includes("explorers") || ag.includes("young explorers");
    const key = isYoungExplorer ? "early" : ag.replace(/\s+/g, "_");
    const stored = localStorage.getItem(this.TOGGLE_KEY + "_" + key);
    if (stored !== null) return stored === "true";
    return true; // Enabled by default across all age groups
  }

  setNarrationEnabled(ageGroupOrEnabled: string | boolean, enabled?: boolean) {
    if (typeof window === "undefined") return;
    if (typeof ageGroupOrEnabled === "boolean") {
      localStorage.setItem(this.TOGGLE_KEY + "_early", String(ageGroupOrEnabled));
      localStorage.setItem(this.TOGGLE_KEY + "_all", String(ageGroupOrEnabled));
      return;
    }
    const ag = (ageGroupOrEnabled || "").toLowerCase().replace(/\s+/g, "_");
    const key = (ag.includes("early") || ag.includes("explorers")) ? "early" : ag;
    localStorage.setItem(this.TOGGLE_KEY + "_" + key, String(enabled ?? true));
  }

  // Deprecated legacy getter so other parts do not fail
  getVoiceUrls(): { kobe: string; chibi: string } {
    return {
      kobe: this.configs.kobe.voice_url || "Kobe_Greeting_Intro_Nigeria.mp3",
      chibi: this.configs.chibi.voice_url || "Chibi_Bedtime_Story_Axe_Senegal.mp3"
    };
  }

  // Play audio file from Supabase storage or synthesize speech with YarnGPT and instant fallback
  async speak(text: string, character: "kobe" | "chibi", ageGroup: string, checkToggle: boolean = true) {
    if (checkToggle && !this.isNarrationEnabled(ageGroup)) {
      return;
    }

    try {
      // Stop any ongoing playback
      this.stop();

      const conf = this.configs[character];

      if (conf.voice_mode === "Uploaded Voice" && conf.voice_url) {
        await this.playUploadedVoice(character);
      } else {
        // Dynamic YarnGPT sovereign voice synthesis with immediate fallback
        await this.speakTTS(text, character, ageGroup);
      }
    } catch (e) {
      console.warn("CompanionVoice speak error:", e);
      this.playBrowserSpeech(text, character, "en", undefined, { ageGroup });
    }
  }

  // Play explicit uploaded voice file
  async playUploadedVoice(character: "kobe" | "chibi"): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.stop();

        const conf = this.configs[character];
        const fileUrl = conf.voice_url;
        if (!fileUrl) {
          console.warn("No Voice URL configured to play.");
          resolve();
          return;
        }

        const finalUrl = (fileUrl.startsWith("http") || fileUrl.startsWith("/"))
          ? fileUrl
          : `/api/companion-voices/${fileUrl}`;

        const audio = new Audio(finalUrl);
        this.activeAudio = audio;
        audio.volume = 1.0;

        audio.play()
          .then(() => {
            audio.onended = () => {
              resolve();
            };
          })
          .catch(err => {
            console.warn("Audio play rejected:", err);
            resolve();
          });
      } catch (err) {
        console.warn("Play uploaded voice error:", err);
        resolve();
      }
    });
  }

  // Play explicit synthesized voice
  playSynthesizedVoice(text: string, character: "kobe" | "chibi", ageGroup: string, language: string = "en") {
    this.stop();
    this.speakTTS(text, character, ageGroup, language);
  }

  // Excited celebratory voice announcement (higher energy, pitch, and enthusiasm)
  async speakExcited(text: string, character: "kobe" | "chibi", ageGroup: string, language: string = "en") {
    return this.speakTTS(text, character, ageGroup, language, { excited: true, ageGroup });
  }

  private isAgesSixToTen(ageGroup?: string): boolean {
    if (!ageGroup) return true;
    const ag = ageGroup.toLowerCase();
    return (
      ag.includes("early") ||
      ag.includes("explorer") ||
      ag.includes("6-10") ||
      ag.includes("6–10") ||
      ag.includes("6 to 10")
    );
  }

  private selectVoiceForCharacter(
    voices: SpeechSynthesisVoice[],
    character: "kobe" | "chibi",
    language: string
  ): { voice?: SpeechSynthesisVoice; isConfirmedMale: boolean } {
    if (!voices || voices.length === 0) {
      return { voice: undefined, isConfirmedMale: false };
    }

    const malePattern = /\b(male|guy|david|mark|daniel|george|ryan|christopher|eric|steffan|rishi|aaron|alex|fred|oliver|thomas|arthur|luke|abeo|tayo|femi|jude|umar|nonso|osagie|adam|nathan|liam|jacob|connor|matthew|andrew|brian|james|paul|richard|steven|edward|kevin)\b/i;
    const femalePattern = /\b(female|woman|girl|zira|hazel|susan|heather|linda|catherine|samantha|victoria|karen|moira|tessa|fiona|serena|aria|jenny|sonia|libby|maisie|natasha|clara|emily|ava|allison|monica|wura|idera|zainab|adaora|mary|regina|chinenye)\b/i;

    const enVoices = voices.filter(
      (v) =>
        v.lang.startsWith("en-NG") ||
        v.lang.startsWith("pcm") ||
        v.lang.startsWith("en-GB") ||
        v.lang.startsWith("en-US") ||
        v.lang.startsWith("en")
    );
    const pool = enVoices.length > 0 ? enVoices : voices;

    if (character === "kobe") {
      // 1. Prefer Nigerian/British/US explicitly male voices first
      const preferredLangOrder = ["en-NG", "en-GB", "en-US", "en"];
      for (const langPrefix of preferredLangOrder) {
        const langMale = pool.find(
          (v) => v.lang.startsWith(langPrefix) && malePattern.test(v.name) && !femalePattern.test(v.name)
        );
        if (langMale) {
          return { voice: langMale, isConfirmedMale: true };
        }
      }
      const anyMale = pool.find((v) => malePattern.test(v.name) && !femalePattern.test(v.name));
      if (anyMale) {
        return { voice: anyMale, isConfirmedMale: true };
      }

      // 2. Next best: a voice that is not explicitly female
      const nonFemale =
        pool.find((v) => v.lang === "en-NG" && !femalePattern.test(v.name)) ||
        pool.find((v) => v.lang.startsWith("en-GB") && !femalePattern.test(v.name)) ||
        pool.find((v) => v.lang.startsWith("en-US") && !femalePattern.test(v.name)) ||
        pool.find((v) => !femalePattern.test(v.name));
      if (nonFemale) {
        return { voice: nonFemale, isConfirmedMale: false };
      }

      return { voice: pool[0], isConfirmedMale: false };
    } else {
      // Chibi: prefer sweet, friendly female voices
      const explicitFemale =
        pool.find((v) => v.lang === "en-NG" && femalePattern.test(v.name)) ||
        pool.find((v) => v.lang.startsWith("en-GB") && femalePattern.test(v.name)) ||
        pool.find((v) => v.lang.startsWith("en-US") && femalePattern.test(v.name)) ||
        pool.find((v) => femalePattern.test(v.name));
      if (explicitFemale) {
        return { voice: explicitFemale, isConfirmedMale: false };
      }

      const nonMale = pool.find((v) => !malePattern.test(v.name)) || pool[0];
      return { voice: nonMale, isConfirmedMale: false };
    }
  }

  // Sovereign YarnGPT speech synthesizer with instant zero-latency browser speech fallback
  async speakTTS(
    text: string,
    character: "kobe" | "chibi",
    ageGroup: string,
    language: string = "en",
    options?: { excited?: boolean; ageGroup?: string }
  ) {
    const resolvedAgeGroup = options?.ageGroup || ageGroup || "early explorers";
    const isYoungExplorer = this.isAgesSixToTen(resolvedAgeGroup);

    try {
      this.stop();

      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language,
          character,
          ageGroup: resolvedAgeGroup
        })
      });

      if (res.ok) {
        const data = await res.json();
        const audioSrc = data.audioBase64 || data.audioUrl;
        if (audioSrc) {
          const audio = new Audio(audioSrc);
          this.activeAudio = audio;
          audio.volume = 1.0;
          if (character === "kobe" && isYoungExplorer) {
            // Friendly, upbeat, playful male cadence for ages 6–10
            audio.playbackRate = options?.excited ? 1.11 : 1.05;
          } else if (options?.excited) {
            audio.playbackRate = 1.07;
          }
          gameMusic.setDucked(true);
          audio.onended = () => {
            gameMusic.setDucked(false);
          };
          audio.onerror = () => {
            gameMusic.setDucked(false);
          };
          await audio.play();
          return;
        }
      }
      // If server TTS was not configured or failed, immediately fallback to browser speech synthesis
      this.playBrowserSpeech(text, character, language, undefined, { ...options, ageGroup: resolvedAgeGroup });
    } catch (e) {
      console.warn("CompanionVoice speakTTS (YarnGPT) offline fallback:", e);
      this.playBrowserSpeech(text, character, language, undefined, { ...options, ageGroup: resolvedAgeGroup });
    }
  }

  // Browser speech synthesis fallback (zero latency, offline resilient)
  playBrowserSpeech(
    text: string, 
    character: "kobe" | "chibi", 
    language: string = "en",
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    },
    options?: { excited?: boolean; ageGroup?: string }
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      callbacks?.onError?.("SpeechSynthesis not supported");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      // Resume in case speech synthesis was paused or suspended by Chrome
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const cleanText = text
        .replace(/[*#_`~>\[\]\(\)\{\}]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!cleanText) {
        callbacks?.onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Pin to instance and global window to prevent V8 garbage collection
      this.activeUtterance = utterance;
      (window as any).__clats_speech_utterance = utterance;

      const isYoungExplorer = this.isAgesSixToTen(options?.ageGroup);

      // Select best gender-matched voice from available system voices
      const voices = window.speechSynthesis.getVoices();
      const { voice: selectedVoice, isConfirmedMale } = this.selectVoiceForCharacter(
        voices,
        character,
        language
      );

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = "en-US";
      }

      if (character === "kobe") {
        if (isYoungExplorer) {
          // Ages 6–10: Male, friendly, warm, playful companion voice
          if (isConfirmedMale) {
            utterance.pitch = options?.excited ? 1.16 : 1.07;
            utterance.rate = options?.excited ? 1.07 : 1.01;
          } else {
            // Shift neutral/default voice into a warm, playful male register
            utterance.pitch = options?.excited ? 0.88 : 0.82;
            utterance.rate = options?.excited ? 1.08 : 1.03;
          }
        } else {
          // Ages 11+: Confident, friendly male voice
          utterance.pitch = isConfirmedMale
            ? (options?.excited ? 1.10 : 1.0)
            : (options?.excited ? 0.86 : 0.80);
          utterance.rate = options?.excited ? 1.05 : 0.98;
        }
      } else {
        // Chibi: Cheerful, sweet female companion voice
        utterance.pitch = options?.excited ? 1.35 : 1.22;
        utterance.rate = options?.excited ? 1.06 : 0.98;
      }

      utterance.onstart = () => {
        gameMusic.setDucked(true);
        callbacks?.onStart?.();
      };

      utterance.onend = () => {
        gameMusic.setDucked(false);
        this.activeUtterance = null;
        (window as any).__clats_speech_utterance = null;
        callbacks?.onEnd?.();
      };

      utterance.onerror = (e) => {
        gameMusic.setDucked(false);
        console.warn("SpeechSynthesis utterance error:", e);
        this.activeUtterance = null;
        (window as any).__clats_speech_utterance = null;
        callbacks?.onError?.(e);
      };

      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      gameMusic.setDucked(false);
      console.warn("Browser SpeechSynthesis fallback error:", err);
      callbacks?.onError?.(err);
    }
  }

  stop() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterance = null;
    if (typeof window !== "undefined") {
      (window as any).__clats_speech_utterance = null;
    }
    gameMusic.setDucked(false);
  }
}

export type MusicThemeId =
  | "wonder_woods_hub"
  | "meadow_spot"
  | "meadow_match"
  | "meadow_classify"
  | "meadow_discover"
  | "meadow_trial"
  | "quiz_quest";

interface MelodyDefinition {
  name: string;
  tempoMs: number;
  waveType: OscillatorType;
  notes: number[]; // Frequencies in Hz (0 = rest)
  bassNotes: number[];
  baseGain: number;
}

const MELODY_LIBRARY: Record<MusicThemeId, MelodyDefinition> = {
  // Enchanted Woodland Overture (Intro, World Map, Mission Board)
  wonder_woods_hub: {
    name: "Enchanted Woodland Overture",
    tempoMs: 550,
    waveType: "triangle",
    notes: [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 0],
    bassNotes: [261.63, 0, 261.63, 0, 220.0, 0, 196.0, 0, 174.61, 0, 196.0, 0, 261.63, 0, 261.63, 0],
    baseGain: 0.16
  },
  // Levels 1–2 (SPOT: Firefly Glow & Stream Stepping Stones)
  meadow_spot: {
    name: "Firefly Dusk Lullaby",
    tempoMs: 600,
    waveType: "triangle",
    notes: [392.0, 493.88, 587.33, 783.99, 659.25, 587.33, 493.88, 0, 392.0, 440.0, 493.88, 587.33, 493.88, 440.0, 392.0, 0],
    bassNotes: [196.0, 0, 0, 0, 220.0, 0, 0, 0, 196.0, 0, 0, 0, 146.83, 0, 0, 0],
    baseGain: 0.16
  },
  // Levels 3–5 (MATCH: Blooming Garden, Woodland Trio, Pebble Rhythm)
  meadow_match: {
    name: "Blooming Meadow Dance",
    tempoMs: 460,
    waveType: "triangle",
    notes: [349.23, 440.0, 523.25, 440.0, 587.33, 523.25, 440.0, 392.0, 349.23, 392.0, 440.0, 523.25, 392.0, 440.0, 349.23, 0],
    bassNotes: [174.61, 0, 261.63, 0, 293.66, 0, 261.63, 0, 233.08, 0, 261.63, 0, 174.61, 0, 174.61, 0],
    baseGain: 0.15
  },
  // Levels 6–7 (CLASSIFY & APPLY: Size Sorters & Dual Feature)
  meadow_classify: {
    name: "Curious Collector's Groove",
    tempoMs: 480,
    waveType: "triangle",
    notes: [440.0, 523.25, 587.33, 659.25, 587.33, 523.25, 440.0, 392.0, 440.0, 0, 523.25, 0, 659.25, 587.33, 523.25, 0],
    bassNotes: [220.0, 0, 261.63, 0, 293.66, 0, 196.0, 0, 220.0, 0, 261.63, 0, 196.0, 0, 220.0, 0],
    baseGain: 0.16
  },
  // Levels 8–9 (DISCOVER: Detective Rule & Sneaky Intruder)
  meadow_discover: {
    name: "Woodland Detective Mystery",
    tempoMs: 520,
    waveType: "triangle",
    notes: [440.0, 0, 523.25, 493.88, 440.0, 0, 329.63, 0, 440.0, 523.25, 659.25, 587.33, 523.25, 493.88, 440.0, 0],
    bassNotes: [220.0, 0, 0, 0, 164.81, 0, 0, 0, 220.0, 0, 0, 0, 196.0, 0, 220.0, 0],
    baseGain: 0.15
  },
  // Level 10 (CREATE / TRIAL: Pattern Keeper's Grand Trial)
  meadow_trial: {
    name: "Ancient Archway Symphony",
    tempoMs: 480,
    waveType: "triangle",
    notes: [523.25, 659.25, 783.99, 1046.5, 987.77, 783.99, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 0],
    bassNotes: [261.63, 0, 392.0, 0, 220.0, 0, 329.63, 0, 174.61, 0, 196.0, 0, 261.63, 0, 261.63, 0],
    baseGain: 0.16
  },
  // Quiz & Arcade Quest Thinking Melody
  quiz_quest: {
    name: "Thinking Cap Melody",
    tempoMs: 620,
    waveType: "triangle",
    notes: [523.25, 0, 659.25, 587.33, 523.25, 0, 392.0, 0, 440.0, 523.25, 587.33, 0, 523.25, 493.88, 523.25, 0],
    bassNotes: [261.63, 0, 0, 0, 196.0, 0, 0, 0, 220.0, 0, 0, 0, 196.0, 0, 261.63, 0],
    baseGain: 0.15
  }
};

class GameMusicController {
  private ctx: AudioContext | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentTheme: MusicThemeId | null = null;
  private stepIndex: number = 0;
  private isDucked: boolean = false;
  private customAudio: HTMLAudioElement | null = null;
  private customTracks: Partial<Record<MusicThemeId, string>> = {};
  private MUSIC_STORAGE_KEY = "clats_game_music_enabled_v1";
  private unlockBound: boolean = false;

  private ensureUnlockListener() {
    if (typeof window === "undefined" || this.unlockBound) return;
    this.unlockBound = true;
    const resumeCtx = () => {
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      if (this.customAudio && this.customAudio.paused && this.currentTheme && this.isMusicEnabled()) {
        this.customAudio.play().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", resumeCtx, { passive: true });
    window.addEventListener("keydown", resumeCtx, { passive: true });
  }

  isMusicEnabled(): boolean {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(this.MUSIC_STORAGE_KEY);
    if (stored !== null) return stored === "true";
    return true;
  }

  setMusicEnabled(enabled: boolean) {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.MUSIC_STORAGE_KEY, String(enabled));
    if (!enabled) {
      this.stop();
    } else if (this.currentTheme) {
      const themeToRestart = this.currentTheme;
      this.currentTheme = null;
      this.startTheme(themeToRestart);
    }
  }

  toggleMusic(): boolean {
    const next = !this.isMusicEnabled();
    this.setMusicEnabled(next);
    return next;
  }

  // Allow custom MP3 URLs if user configures custom songs per theme
  setCustomTrack(theme: MusicThemeId, url: string) {
    this.customTracks[theme] = url;
  }

  getThemeForMeadowLevel(levelId: number): MusicThemeId {
    if (levelId <= 2) return "meadow_spot";
    if (levelId <= 5) return "meadow_match";
    if (levelId <= 7) return "meadow_classify";
    if (levelId <= 9) return "meadow_discover";
    return "meadow_trial";
  }

  getActiveTrackName(): string {
    if (!this.currentTheme) return "Woodland Harmony";
    return MELODY_LIBRARY[this.currentTheme]?.name || "Woodland Harmony";
  }

  setDucked(ducked: boolean) {
    this.isDucked = ducked;
    if (this.customAudio) {
      this.customAudio.volume = ducked ? 0.22 : 0.65;
    }
  }

  startTheme(theme: MusicThemeId) {
    if (typeof window === "undefined") return;
    this.ensureUnlockListener();
    if (this.currentTheme === theme && (this.intervalId !== null || this.customAudio !== null)) {
      return;
    }

    this.stop(false);
    this.currentTheme = theme;

    if (!this.isMusicEnabled()) return;

    // If a custom MP3 track is configured for this theme, play it looped
    const customUrl = this.customTracks[theme];
    if (customUrl) {
      try {
        const audio = new Audio(customUrl);
        audio.loop = true;
        audio.volume = this.isDucked ? 0.22 : 0.65;
        this.customAudio = audio;
        audio.play().catch(() => {});
        return;
      } catch {}
    }

    const melody = MELODY_LIBRARY[theme] || MELODY_LIBRARY.wonder_woods_hub;
    this.stepIndex = 0;

    const playNextNote = () => {
      if (!this.isMusicEnabled()) return;
      if ((window as any).__CLATS_SOUND_ENABLED__ === false) return;

      try {
        if (!this.ctx) {
          this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
        if (this.ctx.state !== "running") return;

        const now = this.ctx.currentTime;
        const idx = this.stepIndex % melody.notes.length;
        const noteFreq = melody.notes[idx];
        const bassFreq = melody.bassNotes[idx % melody.bassNotes.length];
        this.stepIndex++;

        // Volume multiplier drops gently when companion is speaking so both remain audible
        const duckMultiplier = this.isDucked ? 0.38 : 1.0;
        const targetGain = melody.baseGain * duckMultiplier;
        const noteDuration = (melody.tempoMs / 1000) * 0.92;

        if (noteFreq > 0) {
          // Primary warm melody note
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = melody.waveType;
          osc.frequency.setValueAtTime(noteFreq, now);

          gain.gain.setValueAtTime(0.002, now);
          gain.gain.linearRampToValueAtTime(targetGain, now + 0.035);
          gain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + noteDuration);

          // Harmonic bell shimmer (1 octave higher) for crystal clarity on small speakers
          const shimmerOsc = this.ctx.createOscillator();
          const shimmerGain = this.ctx.createGain();
          shimmerOsc.type = "sine";
          shimmerOsc.frequency.setValueAtTime(noteFreq * 2, now);

          shimmerGain.gain.setValueAtTime(0.001, now);
          shimmerGain.gain.linearRampToValueAtTime(targetGain * 0.32, now + 0.025);
          shimmerGain.gain.exponentialRampToValueAtTime(0.0008, now + noteDuration * 0.75);

          shimmerOsc.connect(shimmerGain);
          shimmerGain.connect(this.ctx.destination);
          shimmerOsc.start(now);
          shimmerOsc.stop(now + noteDuration * 0.75);
        }

        if (bassFreq > 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          // Triangle bass carries warm upper harmonics audible on mobile/laptop speakers
          bassOsc.type = "triangle";
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassGain.gain.setValueAtTime(0.002, now);
          bassGain.gain.linearRampToValueAtTime(targetGain * 0.85, now + 0.045);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration * 1.45);

          bassOsc.connect(bassGain);
          bassGain.connect(this.ctx.destination);
          bassOsc.start(now);
          bassOsc.stop(now + noteDuration * 1.45);
        }
      } catch {
        // Ignore AudioContext autoplay restrictions until user interacts
      }
    };

    playNextNote();
    this.intervalId = setInterval(playNextNote, melody.tempoMs);
  }

  stop(clearCurrentTheme: boolean = true) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }
    if (clearCurrentTheme) {
      this.currentTheme = null;
    }
  }
}

export const gameMusic = new GameMusicController();
export const companionVoice = new CompanionVoice();
export const sfx = new AudioSynth();


