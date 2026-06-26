'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import KaTeXRenderer from '../KaTeXRenderer';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function QuadraticSolver() {
  const [a, setA] = useState('1');
  const [b, setB] = useState('-5');
  const [c, setC] = useState('6');
  const [result, setResult] = useState<{
    rows: { label: string; value: string; highlight?: boolean }[];
    latex: string[];
  } | null>(null);

  const solve = () => {
    const A = parseFloat(a), B = parseFloat(b), C = parseFloat(c);
    if (A === 0) {
      setResult({ rows: [{ label: 'Error', value: 'Not a quadratic (a=0)' }], latex: [] });
      return;
    }

    const disc = B * B - 4 * A * C;
    const h = -B / (2 * A);
    const k = A * h * h + B * h + C;

    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    const latex: string[] = [];

    rows.push({ label: 'Equation', value: `${A}x² + ${B}x + ${C} = 0` });
    rows.push({ label: 'Discriminant (Δ)', value: `${B}² − 4(${A})(${C}) = ${disc.toFixed(4)}`, highlight: true });

    if (disc > 0) {
      const r1 = (-B + Math.sqrt(disc)) / (2 * A);
      const r2 = (-B - Math.sqrt(disc)) / (2 * A);
      rows.push({ label: 'x₁', value: r1.toFixed(6), highlight: true });
      rows.push({ label: 'x₂', value: r2.toFixed(6), highlight: true });
      rows.push({ label: 'Nature', value: 'Two distinct real roots' });
      latex.push(`x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} = \\frac{${-B} \\pm \\sqrt{${disc}}}{${2 * A}}`);
    } else if (disc === 0) {
      const r = -B / (2 * A);
      rows.push({ label: 'x (repeated)', value: r.toFixed(6), highlight: true });
      rows.push({ label: 'Nature', value: 'One repeated real root' });
      latex.push(`x = \\frac{-b}{2a} = ${r.toFixed(4)}`);
    } else {
      const real = -B / (2 * A);
      const imag = Math.sqrt(-disc) / (2 * A);
      rows.push({ label: 'x₁', value: `${real.toFixed(4)} + ${imag.toFixed(4)}i`, highlight: true });
      rows.push({ label: 'x₂', value: `${real.toFixed(4)} − ${imag.toFixed(4)}i`, highlight: true });
      rows.push({ label: 'Nature', value: 'Two complex conjugate roots' });
      latex.push(`x = \\frac{-b \\pm \\sqrt{${disc}}}{2a}`);
    }

    rows.push({ label: 'Vertex', value: `(${h.toFixed(4)}, ${k.toFixed(4)})` });
    rows.push({ label: 'Axis of symmetry', value: `x = ${h.toFixed(4)}` });
    rows.push({ label: 'Vertex form', value: `f(x) = ${A}(x − ${h.toFixed(4)})² + ${k.toFixed(4)}` });

    setResult({ rows, latex });
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader icon="ax²" title="Quadratic Solver" description="Solve ax² + bx + c = 0" gradient="from-emerald-500 to-teal-600" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Input placeholder="a" value={a} onChange={(e) => setA(e.target.value)} className="w-16 h-11 text-center text-lg font-bold rounded-xl" />
              <span className="text-lg font-bold text-muted-foreground" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>x² +</span>
              <Input placeholder="b" value={b} onChange={(e) => setB(e.target.value)} className="w-16 h-11 text-center text-lg font-bold rounded-xl" />
              <span className="text-lg font-bold text-muted-foreground" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>x +</span>
              <Input placeholder="c" value={c} onChange={(e) => setC(e.target.value)} className="w-16 h-11 text-center text-lg font-bold rounded-xl" />
              <span className="text-lg font-bold text-muted-foreground">= 0</span>
            </div>
            <Button
              onClick={solve}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
            >
              Solve Equation
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {result && (
        <>
          <ResultCard title="Results" rows={result.rows} latex={result.latex} KaTeXRenderer={KaTeXRenderer} />
        </>
      )}
    </div>
  );
}