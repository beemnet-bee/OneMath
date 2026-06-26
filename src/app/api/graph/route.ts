import { NextRequest, NextResponse } from 'next/server';
import { evaluate } from 'mathjs';

export async function POST(req: NextRequest) {
  try {
    const { expression, xMin = -10, xMax = 10, points: numPoints = 200 } = await req.json();
    if (!expression) {
      return NextResponse.json({ error: 'No expression provided' }, { status: 400 });
    }

    const xMinNum = Number(xMin);
    const xMaxNum = Number(xMax);
    const n = Number(numPoints);
    const step = (xMaxNum - xMinNum) / (n - 1);
    const dataPoints: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < n; i++) {
      const x = xMinNum + i * step;
      try {
        const y = evaluate(expression, { x });
        if (typeof y === 'number' && isFinite(y)) {
          dataPoints.push({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 });
        } else {
          dataPoints.push({ x: Math.round(x * 1000) / 1000, y: null as unknown as number });
        }
      } catch {
        dataPoints.push({ x: Math.round(x * 1000) / 1000, y: null as unknown as number });
      }
    }

    return NextResponse.json({ points: dataPoints, domain: [xMinNum, xMaxNum] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate graph data' }, { status: 500 });
  }
}