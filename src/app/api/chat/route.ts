/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Next.js Route Handler — POST /api/chat
 * Mirrors the Express /api/chat endpoint from server.ts.
 * Calls Google Gemini to generate AI companion responses.
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

export async function POST(req: NextRequest) {
  try {
    const { message, systemPrompt, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const ai = getAIClient();

    // Map chat history to Gemini expected format
    const formattedContents = (history || []).map((h: any) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content || h.text || "" }],
    }));

    formattedContents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt || "You are a helpful AI assistant.",
      },
    });

    const replyText = response.text || "I was unable to understand that. Please try again!";
    return NextResponse.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Kobe.", details: error.message },
      { status: 500 }
    );
  }
}
