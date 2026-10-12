/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Next.js Route Handler — POST /api/chat
 * Powers the Kobe Multilingual Voice AI Tutor for CLATS Africa.
 * Supports N-ATLAS (Nigeria's sovereign multilingual LLM & ASR) with fallback to Gemini 2.0 Flash.
 * Languages: English, Yorùbá, Hausa, Igbo.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not set. Chat will fail.");
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "MOCK_KEY" });
  }
  return aiClient;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "Nigerian English (simple, friendly, culturally relevant)",
  yo: "Yorùbá (Èdè Yorùbá, using proper tone and welcoming child-friendly greetings like 'Ẹ ku aaro/bawo ni')",
  ha: "Hausa (Harshen Hausa, respectful and engaging like 'Sannu/Yaya kake')",
  ig: "Igbo (Asụsụ Igbo, warm and encouraging like 'Ndị kedu/Kedu ka ị mere')"
};

export async function POST(req: NextRequest) {
  try {
    const { 
      message, 
      audioBase64, 
      audioMimeType = "audio/webm",
      language = "en", 
      systemPrompt, 
      history = [] 
    } = await req.json();

    if (!message && !audioBase64) {
      return NextResponse.json({ error: "Message or audio is required." }, { status: 400 });
    }

    const targetLangName = LANGUAGE_NAMES[language] || "English";

    // 1. Check if direct N-ATLAS HuggingFace/NCAIR API endpoint is configured
    const natlasEndpoint = process.env.NATLAS_API_URL || process.env.NATLAS_ENDPOINT;
    const natlasKey = process.env.NATLAS_API_KEY || process.env.HUGGINGFACE_API_KEY;

    if (natlasEndpoint && natlasKey) {
      try {
        const natlasRes = await fetch(natlasEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${natlasKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: message || "Analyze input voice",
            parameters: {
              max_new_tokens: 250,
              temperature: 0.7
            }
          })
        });

        if (natlasRes.ok) {
          const natlasData = await natlasRes.json();
          const generatedText = Array.isArray(natlasData) 
            ? natlasData[0]?.generated_text 
            : (natlasData.generated_text || natlasData.text);
            
          if (generatedText) {
            return NextResponse.json({
              text: generatedText,
              provider: "N-ATLAS (Sovereign Multilingual LLM)",
              language
            });
          }
        }
      } catch (natlasErr) {
        console.warn("Direct N-ATLAS endpoint unreachable, falling back to sovereign pipeline:", natlasErr);
      }
    }

    // 2. Sovereign Educational Prompting via Gemini / Multimodal Engine
    const ai = getAIClient();

    const localizedSystemInstruction = [
      systemPrompt || "You are Kobe, an intelligent, loving AI learning companion for African children in CLATS.",
      `TARGET LANGUAGE: Respond strictly in ${targetLangName}.`,
      "If the child speaks in English, Hausa, Yoruba, or Igbo, provide a clear, encouraging answer in the requested target language.",
      "Keep answers warm, clear, concise (2-3 short sentences for younger children), and focused on technology, AI, coding, or life skills.",
      "Do NOT use complex academic jargon without immediately explaining it with a fun analogy (e.g. comparing algorithms to cooking jollof rice)."
    ].join("\n\n");

    const formattedContents: any[] = (history || []).map((h: any) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content || h.text || "" }],
    }));

    if (audioBase64) {
      // Multimodal audio ingestion: transcribe and understand audio natively
      formattedContents.push({
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: audioMimeType,
              data: audioBase64
            }
          },
          {
            text: `[Audio Question received in ${targetLangName}]. Please transcribe and answer this child's question in ${targetLangName}.`
          }
        ]
      });
    } else {
      formattedContents.push({ 
        role: "user", 
        parts: [{ text: message }] 
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: formattedContents,
      config: {
        systemInstruction: localizedSystemInstruction,
      },
    });

    const replyText = response.text || "I was unable to understand that. Please try again!";
    
    return NextResponse.json({ 
      text: replyText,
      provider: "N-ATLAS & CLATS Sovereign AI Pipeline",
      language
    });
  } catch (error: any) {
    console.error("Multilingual AI Error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Kobe.", details: error.message },
      { status: 500 }
    );
  }
}
