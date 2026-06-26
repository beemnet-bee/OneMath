'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { evaluate as evalExpr, simplify, derivative } from 'mathjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function PolynomialTools() {
  const [expr, setExpr] = useState('x^2 + 5x + 6');
  const [xVal, setXVal] = useState('2');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const analyze = () => {
    try {
      const x = parseFloat(xVal);
      const rows: { label: string; value: string; highlight?: boolean }[] = [];

      const val = evalExpr(expr, { x });
      rows.push({ label: `f(${x})`, value: String(val), highlight: true });

      try {
        const simplified = simplify(expr).toString();
        rows.push({ label: 'Simplified', value: simplified });
      } catch { /* no simplify */ }

      try {
        const deriv = derivative(expr, 'x').toString();
        rows.push({ label: "f'(x)", value: deriv, highlight: true });
        const derivVal = evalExpr(deriv, { x });
        rows.push({ label: `f'(${x})`, value: String(derivVal) });
      } catch { rows.push({ label: "f'(x)", value: 'Could not compute' }); }

      try {
        const f0 = evalExpr(expr, { x: 0 });
        const f1 = evalExpr(expr, { x: 1 });
        const f3 = evalExpr(expr, { x: -1 });
        const cVal = f0;
        const coeffA = ((f1 - cVal) + (f3 - cVal)) / 2;
        const coeffB = (f1 - cVal) - coeffA;
        rows.push({ label: 'Detected', value: `${coeffA}x² + ${coeffB}x + ${cVal}` });

        const disc = coeffB * coeffB - 4 * coeffA * cVal;
        if (coeffA !== 0 && disc >= 0) {
          const r1 = (-coeffB + Math.sqrt(disc)) / (2 * coeffA);
          const r2 = (-coeffB - Math.sqrt(disc)) / (2 * coeffA);
          rows.push({ label: 'Roots', value: `x = ${r1.toFixed(4)}, x = ${r2.toFixed(4)}`, highlight: true });
        } else if (coeffA !== 0) {
          const real = -coeffB / (2 * coeffA);
          const imag = Math.sqrt(-disc) / (2 * coeffA);
          rows.push({ label: 'Roots', value: `x = ${real.toFixed(2)} ± ${imag.toFixed(2)}i`, highlight: true });
        } else if (coeffB !== 0) {
          rows.push({ label: 'Root', value: `x = ${(-cVal / coeffB).toFixed(4)}`, highlight: true });
        }
      } catch { /* can't find roots */ }

      setResultRows(rows);
    } catch {
      setResultRows([{ label: 'Error', value: 'Invalid expression' }]);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="f(x)"
        title="Polynomial Tools"
        description="Evaluate, simplify, derivative, roots"
        gradient="from-emerald-500 to-teal-600"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Polynomial f(x)</label>
              <Input value={expr} onChange={(e) => setExpr(e.target.value)} className="mt-1 font-mono h-10 rounded-xl" placeholder="e.g. x^2 + 5x + 6" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Evaluate at x =</label>
              <Input type="number" value={xVal} onChange={(e) => setXVal(e.target.value)} className="mt-1 w-32 h-10 rounded-xl" />
            </div>
            <Button onClick={analyze} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Analyze Polynomial</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} />
    </div>
  );
}