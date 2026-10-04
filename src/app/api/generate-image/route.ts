import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Note: The provided API key can be configured in .env.local if needed.
    // For now we continue to use a free AI image generator API to ensure it always works.
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(`A close up, high quality, photorealistic food photography shot of the authentic Indian Andhra style dish: ${prompt}. Traditional Andhra cuisine style, spicy, rich red chili and spices, no text, no menus, just the food item itself served traditionally.`);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${seed}`;
    
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
