/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Next.js Route Handler — POST /api/ai/tts
 * Sovereign Nigerian Voice Engine for Kobe (CLATS Africa).
 * Powered exclusively by YarnGPT (https://yarngpt.ai).
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { 
      text, 
      language = "en", 
      character = "kobe" 
    } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required for YarnGPT voice synthesis." }, { status: 400 });
    }

    const yarngptApiKey = process.env.YARNGPT_API_KEY;
    if (!yarngptApiKey) {
      return NextResponse.json(
        { error: "YarnGPT API key (YARNGPT_API_KEY) is not configured in the environment." },
        { status: 500 }
      );
    }

    // Clean text: strip markdown syntax, brackets, formatting characters
    const cleanSpeechText = text
      .replace(/[*#_`~>\[\]\(\)\{\}]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanSpeechText) {
      return NextResponse.json({ error: "No printable text to speak." }, { status: 400 });
    }

    // YarnGPT Sovereign Voice Mapping
    // Male voices for Kobe: tayo (playful, friendly English), femi (Yoruba), umar (Hausa), nonso (Igbo)
    // Female voices for Chibi: wura (English), idera (Yoruba), zainab (Hausa), adaora (Igbo)
    const isChibi = character === "chibi";
    const voiceMap: Record<string, string> = {
      yo: isChibi ? "idera" : "femi",
      ha: isChibi ? "zainab" : "umar",
      ig: isChibi ? "adaora" : "nonso",
      en: isChibi ? "wura" : "tayo"
    };

    const voiceName = voiceMap[language] || (isChibi ? "wura" : "tayo");
    const yarngptEndpoint = process.env.YARNGPT_ENDPOINT || "https://api.yarngpt.ai/api/v1/tts";

    // 1. Submit TTS generation request with required Idempotency-Key
    const idempotencyKey = crypto.randomUUID();
    const yarnRes = await fetch(yarngptEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${yarngptApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({
        text: cleanSpeechText,
        voice: voiceName,
        output_format: "mp3"
      })
    });

    if (!yarnRes.ok) {
      const errText = await yarnRes.text();
      console.error("YarnGPT TTS Error:", yarnRes.status, errText);
      let parsedErr = errText;
      try {
        const errJson = JSON.parse(errText);
        parsedErr = errJson.error?.message || errJson.message || errText;
      } catch {}
      return NextResponse.json(
        { error: `YarnGPT service returned an error (${yarnRes.status}): ${parsedErr}` },
        { status: yarnRes.status >= 500 ? 502 : 400 }
      );
    }

    // Check if direct audio stream returned
    const contentType = yarnRes.headers.get("content-type") || "";
    if (contentType.includes("audio")) {
      const audioBuffer = await yarnRes.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString("base64");
      return NextResponse.json({
        audioBase64: `data:audio/mp3;base64,${base64Audio}`,
        provider: "YarnGPT (Sovereign Nigerian Voice AI)",
        voice: voiceName,
        language
      });
    }

    const yarnData = await yarnRes.json();

    // If direct audio_url returned immediately
    if (yarnData.audio_url) {
      return NextResponse.json({
        audioUrl: yarnData.audio_url,
        provider: "YarnGPT (Sovereign Nigerian Voice AI)",
        voice: voiceName,
        language
      });
    }

    // If asynchronous job returned, poll status endpoint
    const jobId = yarnData.job_id || yarnData.id;
    if (!jobId) {
      return NextResponse.json(
        { error: "YarnGPT did not return a valid job ID or audio URL." },
        { status: 502 }
      );
    }

    const statusEndpoint = `https://api.yarngpt.ai/api/v1/status/${jobId}`;
    let attempts = 0;
    const maxAttempts = 15; // Up to ~9 seconds

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 600));
      attempts++;

      const pollRes = await fetch(statusEndpoint, {
        headers: { "Authorization": `Bearer ${yarngptApiKey}` }
      });

      if (pollRes.ok) {
        const pollData = await pollRes.json();
        if (pollData.status === "completed" && pollData.audio_url) {
          return NextResponse.json({
            audioUrl: pollData.audio_url,
            provider: "YarnGPT (Sovereign Nigerian Voice AI)",
            voice: pollData.voice_name || voiceName,
            language
          });
        }
        if (pollData.status === "failed") {
          console.error("YarnGPT Job Failed:", pollData);
          return NextResponse.json(
            { error: pollData.user_message || pollData.error_message || "YarnGPT speech synthesis failed." },
            { status: 502 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "YarnGPT generation timed out. Please try again." },
      { status: 504 }
    );

  } catch (error: any) {
    console.error("YarnGPT TTS Route Exception:", error);
    return NextResponse.json(
      { error: "Failed to generate YarnGPT sovereign speech", details: error.message },
      { status: 500 }
    );
  }
}
