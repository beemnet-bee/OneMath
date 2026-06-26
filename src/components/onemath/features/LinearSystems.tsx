'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function LinearSystems() {
  const [size, setSize] = useState<2 | 3>(2);
  const [coeffs, setCoeffs] = useState<number[]>([1, 1, 5, 1, -1, 1]);
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const det2 = (m: number[][]) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const det3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
    - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  const solve = () => {
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    if (size === 2) {
      const [a, b, c, d, e, f] = coeffs;
      const D = a * e - b * d;
      if (D === 0) {
        rows.push({ label: 'Result', value: 'No unique solution (det = 0)' });
      } else {
        const x = (c * e - b * f) / D, y = (a * f - c * d) / D;
        rows.push({ label: 'Determinant (D)', value: String(D) });
        rows.push({ label: 'x', value: x.toFixed(4), highlight: true });
        rows.push({ label: 'y', value: y.toFixed(4), highlight: true });
        rows.push({ label: 'Verification', value: `${a}(${x.toFixed(2)}) + ${b}(${y.toFixed(2)}) = ${(a * x + b * y).toFixed(4)} ✓` });
      }
    } else {
      const [a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3] = coeffs;
      const D = det3([[a1, b1, c1], [a2, b2, c2], [a3, b3, c3]]);
      if (D === 0) {
        rows.push({ label: 'Result', value: 'No unique solution (det = 0)' });
      } else {
        const Dx = det3([[d1, b1, c1], [d2, b2, c2], [d3, b3, c3]]);
        const Dy = det3([[a1, d1, c1], [a2, d2, c2], [a3, d3, c3]]);
        const Dz = det3([[a1, b1, d1], [a2, b2, d2], [a3, b3, d3]]);
        rows.push({ label: 'Determinant (D)', value: String(D) });
        rows.push({ label: 'x', value: (Dx / D).toFixed(4), highlight: true });
        rows.push({ label: 'y', value: (Dy / D).toFixed(4), highlight: true });
        rows.push({ label: 'z', value: (Dz / D).toFixed(4), highlight: true });
      }
    }
    setResultRows(rows);
  };

  const getCoeffs = () => {
    const labels2 = ['a₁', 'b₁', '=c₁', 'a₂', 'b₂', '=c₂'];
    const labels3 = ['a₁', 'b₁', 'c₁', '=d₁', 'a₂', 'b₂', 'c₂', '=d₂', 'a₃', 'b₃', 'c₃', '=d₃'];
    const labels = size === 2 ? labels2 : labels3;
    return labels;
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="行列"
        title="Linear Systems Solver"
        description="Solve 2×2 and 3×3 systems via Cramer's rule"
        gradient="from-emerald-500 to-teal-600"
      />

      <div className="flex gap-2">
        <Button variant={size === 2 ? 'default' : 'outline'} size="sm" className="h-10" onClick={() => { setSize(2); setCoeffs([1, 1, 5, 1, -1, 1]); setResultRows([]); }}>2×2</Button>
        <Button variant={size === 3 ? 'default' : 'outline'} size="sm" className="h-10" onClick={() => { setSize(3); setCoeffs([1, 1, 1, 6, 1, -1, 2, 1, 2, 1, 1, 5]); setResultRows([]); }}>3×3</Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>{size === 2 ? 'a₁x + b₁y = c₁' : 'a₁x + b₁y + c₁z = d₁'}</p>
            <div className={`grid gap-2 ${size === 2 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {getCoeffs().map((label, i) => (
                <div key={i}>
                  <label className="text-[10px] text-muted-foreground">{label}</label>
                  <Input type="number" value={coeffs[i] ?? 0}
                    onChange={(e) => { const n = [...coeffs]; n[i] = parseFloat(e.target.value) || 0; setCoeffs(n); }}
                    className="h-9 text-sm mt-0.5 rounded-xl" />
                </div>
              ))}
            </div>
            <Button onClick={solve} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Solve (Cramer&apos;s Rule)</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} />
    </div>
  );
}