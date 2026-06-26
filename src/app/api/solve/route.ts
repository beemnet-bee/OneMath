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

const SYSTEM_PROMPT = `You are OneMath, an expert math solver. You must respond in valid JSON format ONLY with no markdown, no code blocks, no extra text. Your response must be exactly this JSON structure:
{"answer": "the final numeric or symbolic answer", "steps": ["step 1 description", "step 2 description", ...], "latex": ["latex string for step 1", "latex string for step 2", ...]}
Rules:
- If the input is a word problem, parse it and solve step by step
- If it starts with "Calculus:", treat it as a calculus problem
- For simple expressions, just compute and show the result
- Keep steps concise but clear
- Use standard LaTeX notation
- If the answer is a number, simplify it`;

function parseGeminiResponse(text: string) {
  // Strip markdown code blocks if the model wraps them
  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(cleanText);
    return { answer: parsed.answer, steps: parsed.steps || [], latex: parsed.latex || [] };
  } catch {
    return { answer: cleanText, steps: [cleanText], latex: [] };
  }
}

export async function GET(req: NextRequest) {
  const expression = req.nextUrl.searchParams.get('equation') || '';
  if (!expression) {
    return NextResponse.json({ error: 'No equation provided' }, { status: 400 });
  }

  try {
    const model = getGeminiModel();

    const userMessage = expression.startsWith('Calculus:')
      ? `Solve this calculus problem step by step: ${expression.replace('Calculus:', '').trim()}`
      : `Solve this math problem step by step: ${expression}`;

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userMessage },
    ]);

    const text = result.response.text();
    return NextResponse.json(parseGeminiResponse(text));
  } catch (error) {
    console.error('[API /solve] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { answer: `Error: ${message}`, steps: [], latex: [], error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { expression, context = 'general' } = body;

    if (!expression) {
      return NextResponse.json({ error: 'No expression provided' }, { status: 400 });
    }

    const model = getGeminiModel();
    const systemPrompt = `You are OneMath, an expert math solver. Respond in valid JSON ONLY:
{"answer": "final answer", "steps": ["step 1", "step 2", ...], "latex": ["latex1", "latex2", ...]}
Context: ${context}. Keep steps clear. Use standard LaTeX.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Solve: ${expression}` },
    ]);

    const text = result.response.text();
    return NextResponse.json(parseGeminiResponse(text));
  } catch (error) {
    console.error('[API /solve POST] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}