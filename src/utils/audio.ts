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

  playTap() {
    try {
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

  // Check if narration is enabled for a given age group
  isNarrationEnabled(ageGroup: string): boolean {
    const ag = ageGroup?.toLowerCase() || "";
    if (ag.includes("early") || ag.includes("explorers") || ag === "early explorers") {
      // Ages 2-5 ("early explorers") is enabled by default
      const stored = localStorage.getItem(this.TOGGLE_KEY + "_early");
      return stored === null ? true : stored === "true";
    }
    // Ages 6-18 ("young innovators", "future builders") has toggle (default off till turned on)
    const stored = localStorage.getItem(this.TOGGLE_KEY + "_" + ag.replace(/\s+/g, "_"));
    return stored === "true";
  }

  setNarrationEnabled(ageGroup: string, enabled: boolean) {
    const ag = (ageGroup || "").toLowerCase().replace(/\s+/g, "_");
    const key = ag.includes("early") ? "early" : ag;
    localStorage.setItem(this.TOGGLE_KEY + "_" + key, String(enabled));
  }

  // Deprecated legacy getter so other parts do not fail
  getVoiceUrls(): { kobe: string; chibi: string } {
    return {
      kobe: this.configs.kobe.voice_url || "Kobe_Greeting_Intro_Nigeria.mp3",
      chibi: this.configs.chibi.voice_url || "Chibi_Bedtime_Story_Axe_Senegal.mp3"
    };
  }

  // Play audio file from Supabase storage or fall back to high quality voice synthesis
  async speak(text: string, character: "kobe" | "chibi", ageGroup: string, checkToggle: boolean = true) {
    if (checkToggle && !this.isNarrationEnabled(ageGroup)) {
      return;
    }

    try {
      // Cancel any ongoing speech synthesis
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      // Stop any ongoing static file playback
      if (this.activeAudio) {
        this.activeAudio.pause();
        this.activeAudio = null;
      }

      const conf = this.configs[character];

      if (conf.voice_mode === "Uploaded Voice" && conf.voice_url) {
        await this.playUploadedVoice(character);
      } else {
        // Dynamic text-to-speech fallback
        this.speakTTS(text, character, ageGroup);
      }
    } catch (e) {
      console.warn("CompanionVoice speak error:", e);
    }
  }

  // Play explicit uploaded voice file
  async playUploadedVoice(character: "kobe" | "chibi"): Promise<void> {
    return new Promise((resolve) => {
      try {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        if (this.activeAudio) {
          this.activeAudio.pause();
          this.activeAudio = null;
        }

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
  playSynthesizedVoice(text: string, character: "kobe" | "chibi", ageGroup: string) {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
    this.speakTTS(text, character, ageGroup);
  }

  // Custom high precision speech synthesizer matching companion personality
  speakTTS(text: string, character: "kobe" | "chibi", ageGroup: string) {
    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";

      const conf = this.configs[character];
      // custom rates & pitches, default scaled nicely
      if (character === "kobe") {
        utterance.pitch = conf.speech_pitch !== undefined ? conf.speech_pitch : 0.90;
        utterance.rate = conf.speech_rate !== undefined ? conf.speech_rate : 0.95;
      } else {
        utterance.pitch = conf.speech_pitch !== undefined ? conf.speech_pitch : 1.25;
        utterance.rate = conf.speech_rate !== undefined ? conf.speech_rate : 1.02;
      }

      if (window.speechSynthesis.getVoices) {
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (character === "chibi") {
          selectedVoice = voices.find(v =>
            v.lang.startsWith("en") &&
            (v.name.toLowerCase().includes("female") ||
             v.name.toLowerCase().includes("zira") ||
             v.name.toLowerCase().includes("samantha") ||
             v.name.toLowerCase().includes("hazel") ||
             v.name.toLowerCase().includes("google us english"))
          );
        } else {
          selectedVoice = voices.find(v =>
            v.lang.startsWith("en") &&
            (v.name.toLowerCase().includes("male") ||
             v.name.toLowerCase().includes("david") ||
             v.name.toLowerCase().includes("google uk english male"))
          );
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("CompanionVoice speakTTS error:", e);
    }
  }

  stop() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
  }
}

export const companionVoice = new CompanionVoice();
export const sfx = new AudioSynth();
