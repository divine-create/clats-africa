/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Next.js Route Handler — POST /api/ai/tts
 * Sovereign Multi-Tier Voice Synthesis for Kobe (CLATS Africa).
 * 
 * Supports:
 * - YarnGPT (Homegrown Nigerian Voice AI for Yoruba, Hausa, Igbo, Nigerian English)
 * - ElevenLabs (High-fidelity expressive companion voice)
 * - Microsoft Azure Neural Speech (en-NG-Ezinne / en-NG-Abeo)
 * - Browser Web Speech API fallback
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { 
      text, 
      language = "en", 
      character = "kobe", 
      speed = 0.95 
    } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required for TTS." }, { status: 400 });
    }

    // Clean markdown symbols or asterisks before synthesizing speech
    const cleanSpeechText = text
      .replace(/[*#_`~>\[\]]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // 1. TIER 1: YarnGPT (Sovereign Nigerian Voice Engine)
    const yarngptApiKey = process.env.YARNGPT_API_KEY;
    const yarngptEndpoint = process.env.YARNGPT_ENDPOINT || "https://api.yarngpt.ai/api/v1/tts";

    if (yarngptApiKey) {
      try {
        const voiceMap: Record<string, string> = {
          yo: "remi",    // Warm Yoruba female voice
          ha: "umar",    // Clear Hausa male voice
          ig: "nonso",   // Resonant Igbo male voice
          en: character === "chibi" ? "remi" : "mary"
        };
        const voiceName = voiceMap[language] || "mary";

        const yarnRes = await fetch(yarngptEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${yarngptApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: cleanSpeechText,
            voice: voiceName,
            output_format: "mp3",
            target_language: language
          })
        });

        if (yarnRes.ok) {
          const contentType = yarnRes.headers.get("content-type") || "";
          if (contentType.includes("audio")) {
            const audioBuffer = await yarnRes.arrayBuffer();
            const base64Audio = Buffer.from(audioBuffer).toString("base64");
            return NextResponse.json({
              audioBase64: `data:audio/mp3;base64,${base64Audio}`,
              provider: "YarnGPT (Sovereign Nigerian Voice AI)",
              language
            });
          }

          const yarnData = await yarnRes.json();
          
          // If direct audio_url returned
          if (yarnData.audio_url || yarnData.audioBase64) {
            return NextResponse.json({
              audioUrl: yarnData.audio_url,
              audioBase64: yarnData.audioBase64,
              provider: "YarnGPT (Sovereign Nigerian Voice AI)",
              language
            });
          }

          // If asynchronous job_id returned, poll for completion
          const jobId = yarnData.job_id || yarnData.id;
          if (jobId) {
            const statusEndpoint = `https://api.yarngpt.ai/api/v1/status/${jobId}`;
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
              await new Promise((r) => setTimeout(r, 600)); // wait 600ms
              attempts++;

              const pollRes = await fetch(statusEndpoint, {
                headers: { "Authorization": `Bearer ${yarngptApiKey}` }
              });

              if (pollRes.ok) {
                const pollData = await pollRes.json();
                if (pollData.audio_url) {
                  return NextResponse.json({
                    audioUrl: pollData.audio_url,
                    provider: "YarnGPT (Sovereign Nigerian Voice AI)",
                    language
                  });
                }
                if (pollData.status === "failed") {
                  console.warn("YarnGPT job failed:", pollData.user_message);
                  break;
                }
              }
            }
          }
        } else {
          const errText = await yarnRes.text();
          console.warn("YarnGPT API responded with error status:", yarnRes.status, errText);
        }
      } catch (yarnErr) {
        console.warn("YarnGPT synthesis attempt failed, falling to secondary tier:", yarnErr);
      }
    }

    // 2. TIER 2: ElevenLabs (Expressive High-Emotion Mascot Voice)
    const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
    if (elevenlabsKey) {
      try {
        // Default energetic voice or Nigerian cloned voice if configured
        const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel / Friendly default
        const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "xi-api-key": elevenlabsKey,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
          },
          body: JSON.stringify({
            text: cleanSpeechText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.65,
              similarity_boost: 0.8,
              style: 0.35,
              use_speaker_boost: true
            }
          })
        });

        if (elevenRes.ok) {
          const audioBuffer = await elevenRes.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString("base64");
          return NextResponse.json({
            audioBase64: `data:audio/mp3;base64,${base64Audio}`,
            provider: "ElevenLabs Multilingual v2",
            language
          });
        }
      } catch (elErr) {
        console.warn("ElevenLabs synthesis attempt failed, falling to secondary tier:", elErr);
      }
    }

    // 3. TIER 3: Microsoft Azure Neural Speech (en-NG-EzinneNeural / en-NG-AbeoNeural)
    const azureKey = process.env.AZURE_SPEECH_KEY;
    const azureRegion = process.env.AZURE_SPEECH_REGION || "eastus";
    if (azureKey && language === "en") {
      try {
        const azureVoice = character === "chibi" ? "en-NG-EzinneNeural" : "en-NG-AbeoNeural";
        const ssml = `<speak version='1.0' xml:lang='en-NG'><voice name='${azureVoice}'>${cleanSpeechText}</voice></speak>`;

        const azureRes = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": azureKey,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3"
          },
          body: ssml
        });

        if (azureRes.ok) {
          const audioBuffer = await azureRes.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString("base64");
          return NextResponse.json({
            audioBase64: `data:audio/mp3;base64,${base64Audio}`,
            provider: `Azure Neural (${azureVoice})`,
            language
          });
        }
      } catch (azErr) {
        console.warn("Azure Speech synthesis attempt failed:", azErr);
      }
    }

    // 4. TIER 4: Local / Web Speech API Browser Fallback
    // Return instruction for the frontend to play using high-tuned Web Speech API
    return NextResponse.json({
      fallbackToBrowser: true,
      text: cleanSpeechText,
      language,
      provider: "Browser Neural Synthesis"
    });

  } catch (error: any) {
    console.error("TTS Route Error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech", details: error.message, fallbackToBrowser: true },
      { status: 500 }
    );
  }
}
