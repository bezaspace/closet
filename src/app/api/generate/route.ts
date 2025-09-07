import { NextResponse } from "next/server";
import fs from "fs";

// Minimal server-side handler that expects JSON body:
// { userImage: string(base64), clothImage: string(base64) }
// It uses @google/genai if available via env var GENAI_API_KEY.

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userImage, clothImage } = body || {};

    if (!userImage || !clothImage) {
      return NextResponse.json({ error: "Both images are required." }, { status: 400 });
    }

    if (!process.env.GENAI_API_KEY) {
      return NextResponse.json({ error: "Server misconfigured: missing GENAI_API_KEY" }, { status: 500 });
    }

    // Dynamically import the SDK so this code works in ESM/Next runtimes
    let genaiClient: any = null;
    try {
      const mod = await import("@google/genai");
      const GoogleGenAI = mod?.GoogleGenAI || mod?.default?.GoogleGenAI || mod?.default;
      const apiKey = process.env.GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!GoogleGenAI) {
        return NextResponse.json({ error: "GenAI SDK import failed (no export)." }, { status: 500 });
      }
      genaiClient = new GoogleGenAI({ apiKey });
    } catch (err: any) {
      return NextResponse.json({ error: "GenAI SDK not installed on server or failed to import: " + String(err?.message || err) }, { status: 500 });
    }

    // Compose prompt and inputs following the Gemini image generation example
  const prompt = `Edit the FIRST image (the user image). Replace only the clothing on the person in the FIRST image with the clothing shown in the SECOND image. Use the SECOND image solely as a clothing reference (texture, color, pattern and fabric detail). Do NOT copy or include the other person, face, body, or background from the SECOND image. Preserve the FIRST image person's face, hair, skin tone, body shape, and pose exactly; only change the outfit. Produce a photorealistic, full-body, head-to-toe vertical portrait (show the entire body). Align and drape the clothing realistically to the user's body and pose. Keep natural lighting consistent with the user's photo. Output a single, photorealistic image of the user wearing the clothing. Do not add watermarks, text, or extra people.`;

    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/png",
          data: userImage.replace(/^data:image\/[a-z]+;base64,/, ""),
        },
      },
      {
        inlineData: {
          mimeType: "image/png",
          data: clothImage.replace(/^data:image\/[a-z]+;base64,/, ""),
        },
      },
    ];

    // Call the model
    const response = await genaiClient.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents,
    });

    const parts = response?.candidates?.[0]?.content?.parts || [];
    let outImageBase64 = null;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        outImageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!outImageBase64) {
      return NextResponse.json({ error: "No image returned from model." }, { status: 500 });
    }

    // return data URI
    const dataUri = `data:image/png;base64,${outImageBase64}`;
    return NextResponse.json({ image: dataUri });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
