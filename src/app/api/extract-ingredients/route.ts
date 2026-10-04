import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { steps } = await request.json();
    
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: "Steps are required" }, { status: 400 });
    }

    const prompt = `Extract all the essential grocery ingredient names (kirana items) from the following recipe steps. 
Return ONLY a valid JSON array of strings representing the ingredient names.
CRITICAL: For each ingredient, format the string exactly like this: "English Name (Hindi transliteration) (Telugu transliteration)".
Example formats: 
"Tomato (Tamatar) (Ramamulaga)"
"Okra (Bhindi) (Bendakaya)"
"Chicken (Murgh) (Kodi)"
Do not include quantities, instructions, or any markdown formatting (no \`\`\`json). Just the JSON array.

Steps:
${steps.join("\n")}`;

    let text = "[]";
    let apiKey = process.env.GEMINI_API_KEY || process.env.FALLBACK_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const geminiResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });
        text = geminiResponse.text || "[]";
      } catch (geminiError) {
        console.error("Gemini failed, falling back to free API:", geminiError);
        // Fallback below
        apiKey = null;
      }
    }

    if (!apiKey) {
      // Use a free text generation API as a fallback
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a precise data extraction assistant." },
            { role: "user", content: prompt }
          ],
          model: "openai" 
        })
      });

      if (response.ok) {
        text = await response.text() || "[]";
      }
    }
    
    // Clean up potential markdown blocks if the model still includes them
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let ingredients = [];
    try {
      ingredients = JSON.parse(cleanedText);
      if (!Array.isArray(ingredients)) {
          ingredients = [];
      }
    } catch (e) {
      console.error("Failed to parse AI response as JSON", text);
      ingredients = [];
    }
    
    return NextResponse.json({ ingredients });
  } catch (error: any) {
    console.error("Ingredient extraction failed:", error);
    return NextResponse.json({ error: error.message || "Failed to extract ingredients" }, { status: 500 });
  }
}
