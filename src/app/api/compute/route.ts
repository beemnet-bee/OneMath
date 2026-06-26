import { NextRequest, NextResponse } from 'next/server';
import { evaluate } from 'mathjs';

export async function GET(req: NextRequest) {
  const expression = req.nextUrl.searchParams.get('expression') || '';
  if (!expression) {
    return NextResponse.json({ error: 'No expression provided' }, { status: 400 });
  }

  try {
    const result = evaluate(expression);
    return NextResponse.json({ result: String(result) });
  } catch (error) {
    return NextResponse.json(
      { error: `Cannot evaluate: ${expression}`, result: 'Error' },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { expression } = await req.json();
    if (!expression) {
      return NextResponse.json({ error: 'No expression' }, { status: 400 });
    }
    const result = evaluate(expression);
    return NextResponse.json({ result: String(result) });
  } catch (error) {
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 400 });
  }
}