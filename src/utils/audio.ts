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
      case "levelup":
      case "reward":
      case "celebrate":
        this.playLevelUp();
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
      this.playBrowserSpeech(text, character);
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

  // Sovereign YarnGPT speech synthesizer with instant zero-latency browser speech fallback
  async speakTTS(text: string, character: "kobe" | "chibi", ageGroup: string, language: string = "en") {
    try {
      this.stop();

      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language,
          character
        })
      });

      if (res.ok) {
        const data = await res.json();
        const audioSrc = data.audioBase64 || data.audioUrl;
        if (audioSrc) {
          const audio = new Audio(audioSrc);
          this.activeAudio = audio;
          audio.volume = 1.0;
          await audio.play();
          return;
        }
      }
      // If server TTS was not configured or failed, immediately fallback to browser speech synthesis
      this.playBrowserSpeech(text, character, language);
    } catch (e) {
      console.warn("CompanionVoice speakTTS (YarnGPT) offline fallback:", e);
      this.playBrowserSpeech(text, character, language);
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
    }
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

      // Select best matching voice from available system voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        let selectedVoice: SpeechSynthesisVoice | undefined;
        if (language === "yo" || language === "ha" || language === "ig") {
          selectedVoice = voices.find(v => v.lang.startsWith("en-NG") || v.lang.startsWith("pcm"));
        }
        if (!selectedVoice) {
          selectedVoice =
            voices.find(v => v.lang === "en-NG") ||
            voices.find(v => v.lang.startsWith("en-GB")) ||
            voices.find(v => v.lang.startsWith("en-US")) ||
            voices.find(v => v.lang.startsWith("en"));
        }
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          utterance.lang = "en-US";
        }
      } else {
        utterance.lang = "en-US";
      }

      utterance.pitch = character === "chibi" ? 1.2 : 0.95;
      utterance.rate = 0.95;

      utterance.onstart = () => {
        callbacks?.onStart?.();
      };

      utterance.onend = () => {
        this.activeUtterance = null;
        (window as any).__clats_speech_utterance = null;
        callbacks?.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn("SpeechSynthesis utterance error:", e);
        this.activeUtterance = null;
        (window as any).__clats_speech_utterance = null;
        callbacks?.onError?.(e);
      };

      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
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
  }
}

export const companionVoice = new CompanionVoice();
export const sfx = new AudioSynth();
