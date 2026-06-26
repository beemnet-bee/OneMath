import { NextRequest, NextResponse } from 'next/server';
import { formulas, type Formula } from '@/data/formulas';

export async function GET(req: NextRequest) {
  const search = (req.nextUrl.searchParams.get('search') || '').toLowerCase();
  const category = req.nextUrl.searchParams.get('category') || '';

  let results: Formula[] = formulas;

  if (category && category !== 'all') {
    results = results.filter((f) => f.category === category);
  }

  if (search) {
    results = results.filter(
      (f) =>
        f.name.toLowerCase().includes(search) ||
        f.description.toLowerCase().includes(search) ||
        f.keywords.some((k) => k.toLowerCase().includes(search))
    );
  }

  const top = results.slice(0, 20).map(({ id, name, category, latex, description }) => ({
    id, name, category, latex, description,
  }));

  return NextResponse.json({ results: top, total: results.length });
}