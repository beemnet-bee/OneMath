'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

function factorial(n: number): number {
  if (n <= 1) return 1;
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function permutation(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / factorial(n - r);
}

function combination(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

export default function ProbabilityCalculator() {
  const [n, setN] = useState('10');
  const [r, setR] = useState('3');
  const [p, setP] = useState('');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const calc = () => {
    const numN = parseInt(n), numR = parseInt(r);
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    rows.push({ label: 'P(n, r)', value: permutation(numN, numR).toFixed(0), highlight: true });
    rows.push({ label: 'C(n, r)', value: combination(numN, numR).toFixed(0), highlight: true });
    rows.push({ label: 'n!', value: numN <= 170 ? factorial(numN).toExponential(4) : 'Too large' });
    if (p) {
      const prob = parseFloat(p);
      const q = 1 - prob;
      const binom = combination(numN, numR);
      rows.push({ label: 'P(X=r)', value: (binom * Math.pow(prob, numR) * Math.pow(q, numN - numR)).toFixed(6), highlight: true });
      rows.push({ label: 'E(X)', value: (numN * prob).toFixed(4) });
      rows.push({ label: 'Var(X)', value: (numN * prob * q).toFixed(4) });
      rows.push({ label: 'σ', value: Math.sqrt(numN * prob * q).toFixed(4) });
    }
    setResultRows(rows);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="🎲"
        title="Probability Calculator"
        description="Permutations, combinations, binomial distribution"
        gradient="from-pink-500 to-rose-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>n</label>
                <Input type="number" value={n} onChange={(e) => setN(e.target.value)} className="mt-1 h-10 rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>r</label>
                <Input type="number" value={r} onChange={(e) => setR(e.target.value)} className="mt-1 h-10 rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>p (optional)</label>
                <Input type="number" step="0.01" value={p} onChange={(e) => setP(e.target.value)} placeholder="0.5" className="mt-1 h-10 rounded-xl" />
              </div>
            </div>
            <Button onClick={calc} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Calculate</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} />
    </div>
  );
}