/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Next.js Route Handler — POST /api/chat
 * Powers the Kobe Multilingual Voice AI Tutor for CLATS Africa.
 * Architecture:
 *   1. Multimodal Audio ASR: Whisper Large v3 Turbo via Groq Sovereign Audio Pipeline
 *   2. Sovereign Multilingual LLM: Groq (GPT-OSS-120B / Qwen-27B) + N-ATLAS 8B
 *   3. Secondary Fallback: Gemini 2.0 Flash (if configured)
 *   4. Zero-Failure Fallback: Sovereign Pedagogical Knowledge Engine (ensures 100% uptime)
 * Languages: Nigerian English, Yorùbá, Hausa, Igbo.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MOCK_KEY" || apiKey.trim().length < 10) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "Nigerian English (simple, friendly, child-relatable)",
  yo: "Yorùbá (Èdè Yorùbá, warm and welcoming, using child-friendly greetings like 'Ẹ ku aaro/bawo ni')",
  ha: "Hausa (Harshen Hausa, respectful, engaging, like 'Sannu/Yaya kake')",
  ig: "Igbo (Asụsụ Igbo, encouraging and warm, like 'Ndị kedu/Kedu ka ị mere')"
};

/**
 * Transcribe base64 voice note to text using Whisper Large v3 Turbo on Groq
 */
async function transcribeAudio(audioBase64: string, mimeType: string, groqKey: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(audioBase64, "base64");
    if (buffer.length < 500) return null; // Avoid tiny empty chunks

    const ext = mimeType.includes("wav") ? "wav" : mimeType.includes("mp4") ? "m4a" : "webm";
    const file = new File([buffer], `voice.${ext}`, { type: mimeType || "audio/webm" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("prompt", "Children classroom learning technology in Nigeria, English, Yoruba, Hausa, Igbo");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`
      },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      return data.text ? data.text.trim() : null;
    }
  } catch (err) {
    console.warn("Audio transcription note:", err);
  }
  return null;
}

/**
 * Call Groq sovereign multilingual models
 */
async function callGroqLLM(
  messages: Array<{ role: string; content: string }>,
  groqKey: string
): Promise<string | null> {
  const models = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"];

  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          return content.trim();
        }
      }
    } catch (err) {
      console.warn(`Groq model ${model} attempt note:`, err);
    }
  }
  return null;
}

/**
 * Intelligent sovereign pedagogical fallback engine
 * Guarantees Kobe NEVER breaks or goes silent even during complete network cuts
 */
function getSovereignPedagogicalFallback(
  query: string,
  lang: string,
  compName: string = "Kobe"
): string {
  const q = (query || "").toLowerCase();

  // 1. Algorithms & Step-by-Step Logic
  if (q.includes("algorithm") || q.includes("step") || q.includes("jollof") || q.includes("recipe") || q.includes("algoridimu")) {
    if (lang === "yo") {
      return `Algoridimu jẹ́ àkójọ àwọn ìgbésẹ̀ tí a tẹ̀lé láti yanjú ìṣòro kan—gan-an gẹ́gẹ́ bí bí a ṣe ń ṣe ìrẹsì jollof aládùn! Kọ̀mpútà gbọ́dọ̀ tẹ̀lé àwọn ìgbésẹ̀ wọ̀nyí lọ́kọ̀ọ̀kan láti ṣiṣẹ́ dáadáa.`;
    }
    if (lang === "ha") {
      return `Algorithm wani tsari ne na matakai daki-daki da kwamfuta ke bi domin gudanar da aiki—kamar dai yadda ake dafa shinkafa jollof mai dadi! Idan ka bi matakan, aikin zai fito daidai.`;
    }
    if (lang === "ig") {
      return `Algorithm bụ usoro a na-eso iji rụọ ọrụ—dị ka usoro esi esi osikapa jollof na-atọ ụtọ! Kọmpụta na-eso usoro ndị a iji dozie nsogbu ọ bụla.`;
    }
    return `An algorithm is like a step-by-step recipe for making delicious jollof rice! Just like you chop onions, fry tomatoes, and simmer the rice in order, a computer follows clear steps to solve problems!`;
  }

  // 2. Coding & Programming
  if (q.includes("code") || q.includes("coding") || q.includes("program") || q.includes("koodu")) {
    if (lang === "yo") {
      return `Koodu (Coding) ni èdè àrà tí a fi ń bá kọ̀mpútà sọ̀rọ̀! Nípa kíkọ koodu, o lè kọ́ eré ayọ̀, ṣe àwọn ohun èlò AI, kí o sì yanjú àwọn ìṣòro fún àwùjọ wa.`;
    }
    if (lang === "ha") {
      return `Koding shine yaren da muke amfani da shi wajen magana da kwamfuta! Ta hanyar koding, zaka iya ƙirƙirar wasannin bidiyo da fasahar AI mai ban mamaki.`;
    }
    if (lang === "ig") {
      return `Koodu bụ asụsụ anyị na-eji agwa kọmpụta okwu! Ọ na-enye gị ike ịmepụta egwuregwu, animation, na ngwa teknụzụ dị mma.`;
    }
    return `Coding is giving superpowers to computers! When you write code, you tell the computer exactly what to build—from video games to smart AI apps. You are the digital creator!`;
  }

  // 3. Online Safety & Passwords
  if (q.includes("safe") || q.includes("password") || q.includes("security") || q.includes("ìpamọ́")) {
    if (lang === "yo") {
      return `Tọ́jú ọ̀rọ̀-ìpamọ́ (password) rẹ mọ́ bí ohun ìṣúra olówóiyebíye! Máṣe fi pamọ́ fún àwọn àjèjì, kí o sì lo àwọn lẹ́tà àti nọ́ḿbà tí ó lágbára.`;
    }
    if (lang === "ha") {
      return `Ka kare kalmar sirrinka (password) kamar yadda zaka kare dukiyarka! Kada ka raba ta da kowa banda iyayenka, kuma ka tabbatar tana da karfi.`;
    }
    if (lang === "ig") {
      return `Chekwaa okwuntughe (password) gị nke ọma! Ekenela ya ndị ị na-amaghị, jiri mkpụrụedemede na nọmba siri ike mee ya.`;
    }
    return `Your password is like a secret key to your personal treasure box! Never share your passwords with strangers, and keep them strong using a mix of letters, numbers, and symbols.`;
  }

  // 4. Quiz Hint & Lesson Support
  if (q.includes("hint") || q.includes("quiz") || q.includes("help") || q.includes("question")) {
    if (lang === "yo") {
      return `Wo àwọn àṣàyàn náà dáadáa! Rántí ohun tí a kọ́ nínú ìtàn náà. Ìbéèrè náà ń béèrè ohun tí ó ṣe pàtàkì jùlọ fún kọ̀mpútà. O lè ṣe é!`;
    }
    if (lang === "ha") {
      return `Duba zaɓuɓɓukan da kyau! Ka tuna babban darasin da muka koya. Wanne zaɓi ne yafi bayyana yadda fasahar ke aiki? Ka gwada!`;
    }
    if (lang === "ig") {
      return `Lee anya na nhọrọ ndị ahụ nke ọma! Cheta ihe anyị mụtara na akụkọ ahụ. Kedu nke dabara na isiokwu anyị? Ị ga-enweta ya!`;
    }
    return `Look closely at the choices! Think back to our lesson story and how instructions work step by step. Which option best matches what computers need to succeed? You've got this!`;
  }

  // 5. General Encouragement / Welcome
  if (lang === "yo") {
    return `Ẹ n lẹ́ o, akọni ìmọ̀-ẹ̀rọ! Èmi ni ${compName}. Mo wà níbí láti ràn ọ́ lọ́wọ́ láti di olùkọ́ àti ọ̀mọ̀wé kọ̀mpútà ní Áfíríkà. Kí ni o fẹ́ kọ́ lónìí?`;
  }
  if (lang === "ha") {
    return `Sannu da zuwa, gwarzon fasaha! Ni ne ${compName}. Na shirya taimaka maka ka zama gwanin kwamfuta da fasahar zamani. Wane abu kake son koya a yau?`;
  }
  if (lang === "ig") {
    return `Ndewo ezigbo enyi m! Abụ m ${compName}. Anọ m ebe a iji nyere gị aka ịmụta kọmputa na nkà na ụzụ ọgbara ọhụrụ. Kedu ihe ị chọrọ ịmụta taa?`;
  }
  return `Hello superstar! I am ${compName}, your learning champion. I'm right here with you to explore AI, coding, and technology. What exciting question do you have for me today?`;
}

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

    const groqKey = process.env.GROQ_API_KEY || "";
    const targetLangName = LANGUAGE_NAMES[language] || "Nigerian English";

    // ── 1. Voice Ingestion & Audio Transcription ────────────────────────────
    let effectiveUserQuery = message || "";

    if (audioBase64 && groqKey) {
      const transcribed = await transcribeAudio(audioBase64, audioMimeType, groqKey);
      if (transcribed) {
        effectiveUserQuery = transcribed;
      }
    }

    if (!effectiveUserQuery && audioBase64) {
      effectiveUserQuery = `[Spoken voice question in ${targetLangName}]`;
    }

    // ── 2. Build Educational System Instructions ───────────────────────────
    const localizedSystemInstruction = [
      systemPrompt || "You are Kobe, an intelligent, loving AI learning companion for African children in CLATS Africa.",
      `TARGET LANGUAGE: Respond strictly in ${targetLangName}.`,
      "Keep answers warm, clear, child-friendly, concise (2 to 3 sentences maximum for younger children), and focused on technology, AI, coding, or online safety.",
      "Use culturally resonant Nigerian analogies (like cooking jollof rice or games of Ayo) when explaining technical terms."
    ].join("\n\n");

    const groqMessages = [
      { role: "system", content: localizedSystemInstruction },
      ...(history || []).slice(-6).map((h: any) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: String(h.content || h.text || "")
      })),
      { role: "user", content: effectiveUserQuery }
    ];

    // ── 3. Tier 1: Ultra-Fast Multilingual Groq Inference ──────────────────
    if (groqKey) {
      const groqReply = await callGroqLLM(groqMessages, groqKey);
      if (groqReply) {
        return NextResponse.json({
          text: groqReply,
          provider: "N-ATLAS & CLATS Sovereign AI (Groq Accelerated Pipeline)",
          language,
          transcribedQuery: audioBase64 ? effectiveUserQuery : undefined
        });
      }
    }

    // ── 4. Tier 2: Direct N-ATLAS Hugging Face Inference (if active) ───────
    const natlasKey = process.env.NATLAS_API_KEY || process.env.HUGGINGFACE_API_KEY;
    const natlasEndpoint = process.env.NATLAS_API_URL || process.env.NATLAS_ENDPOINT;

    if (natlasKey && natlasEndpoint) {
      try {
        const fullPrompt = `${localizedSystemInstruction}\n\nChild: ${effectiveUserQuery}\nKobe:`;
        const natlasRes = await fetch(natlasEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${natlasKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: { max_new_tokens: 250, temperature: 0.7, return_full_text: false }
          })
        });

        if (natlasRes.ok) {
          const natlasData = await natlasRes.json();
          const generatedText = Array.isArray(natlasData) 
            ? natlasData[0]?.generated_text 
            : (natlasData.generated_text || natlasData.text);
          if (generatedText) {
            return NextResponse.json({
              text: generatedText.replace(/^Kobe:\s*/i, "").trim(),
              provider: "N-ATLAS 8B (NCAIR Sovereign Model)",
              language
            });
          }
        }
      } catch (natlasErr) {
        console.warn("Direct N-ATLAS attempt note:", natlasErr);
      }
    }

    // ── 5. Tier 3: Gemini 2.0 Flash (if configured with real key) ───────────
    const gemini = getAIClient();
    if (gemini) {
      try {
        const formattedContents = [
          ...(history || []).slice(-6).map((h: any) => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content || h.text || "" }]
          })),
          { role: "user", parts: [{ text: effectiveUserQuery }] }
        ];

        const response = await gemini.models.generateContent({
          model: "gemini-2.0-flash",
          contents: formattedContents,
          config: { systemInstruction: localizedSystemInstruction }
        });

        if (response.text) {
          return NextResponse.json({
            text: response.text.trim(),
            provider: "Gemini 2.0 Multimodal Flash",
            language
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini inference note:", geminiErr);
      }
    }

    // ── 6. Tier 4: Zero-Failure Sovereign Pedagogical Fallback ─────────────
    // Ensures Kobe NEVER returns 500 error or leaves the child hanging!
    const pedagogicalReply = getSovereignPedagogicalFallback(effectiveUserQuery, language, "Kobe");

    return NextResponse.json({
      text: pedagogicalReply,
      provider: "CLATS Sovereign Knowledge Engine",
      language,
      transcribedQuery: audioBase64 ? effectiveUserQuery : undefined
    });

  } catch (error: any) {
    console.error("Multilingual AI Handler Note:", error);
    // Never return a failure to the child: always provide a friendly learning response
    const safeFallback = getSovereignPedagogicalFallback("", "en", "Kobe");
    return NextResponse.json({
      text: safeFallback,
      provider: "CLATS Sovereign Knowledge Engine",
      language: "en"
    });
  }
}
