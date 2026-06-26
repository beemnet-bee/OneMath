import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to your .env file.\n' +
      'Get a free key at: https://aistudio.google.com/app/apikey'
    );
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

const IMAGE_PROMPT = `You are OneMath, an expert math solver. Analyze this math problem from the image. Solve it step by step. Respond in valid JSON ONLY (no markdown, no code blocks): {"detected_equation": "what you read from the image", "answer": "final answer", "steps": ["step 1", "step 2", ...], "latex": ["latex1", "latex2", ...]}`;

function parseGeminiResponse(text: string) {
  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleanText);
  } catch {
    return { detected_equation: '', answer: cleanText, steps: [cleanText], latex: [] };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const model = getGeminiModel();

    const result = await model.generateContent([
      { text: IMAGE_PROMPT },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: image,
        },
      },
    ]);

    const text = result.response.text();
    return NextResponse.json(parseGeminiResponse(text));
  } catch (error) {
    console.error('[API /solve-image] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to analyze image: ${message}` }, { status: 500 });
  }
}