import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Note: The provided Gemini API key returns a "Quota: 0" error or requires Vertex AI 
    // for the image generation models on the free tier. 
    // As a fallback to ensure the feature works, we are using a free AI image generator API.
    const encodedPrompt = encodeURIComponent(`Delicious, appetizing, professional food photography of ${prompt}. Studio lighting, high resolution, soft background.`);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true`;
    
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error("Failed to generate image");
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    
    return NextResponse.json({ image: `data:image/jpeg;base64,${base64Image}` });
  } catch (error: any) {
    console.error("Image generation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to generate image" }, { status: 500 });
  }
}
