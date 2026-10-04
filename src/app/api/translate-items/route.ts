import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { items } = await request.json(); // array of strings
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.FALLBACK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const prompt = `Translate the following grocery items. For each item, return a string formatted exactly like this: "English Name (Hindi transliteration) (Telugu transliteration)".
Example: "Tomato" -> "Tomato (Tamatar) (Ramamulaga)"
Return ONLY a valid JSON array of these formatted strings in the exact same order as the input. Do not include markdown formatting.

Items to translate:
${JSON.stringify(items)}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });
    
    const text = response.text || "[]";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let translated = [];
    try {
      translated = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse translations:", text);
      translated = items; // fallback to original if parsing fails
    }

    return NextResponse.json({ translated });
  } catch (error: any) {
    console.error("Translation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to translate" }, { status: 500 });
  }
}
