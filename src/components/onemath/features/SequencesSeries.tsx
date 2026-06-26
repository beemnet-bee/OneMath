'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function SequencesSeries() {
  const [type, setType] = useState<'arithmetic' | 'geometric' | 'fibonacci'>('arithmetic');
  const [a1, setA1] = useState('1');
  const [d, setD] = useState('2');
  const [n, setN] = useState('10');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);

  const calculate = () => {
    const numA = parseFloat(a1), numD = parseFloat(d), numN = parseInt(n);
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    let seq: number[] = [];

    if (type === 'arithmetic') {
      const aN = numA + (numN - 1) * numD;
      const sumN = numN / 2 * (2 * numA + (numN - 1) * numD);
      rows.push({ label: 'Parameters', value: `a₁ = ${numA}, d = ${numD}` });
      rows.push({ label: 'nᵗʰ term (aₙ)', value: `a₁ + (n-1)d = ${aN.toFixed(4)}`, highlight: true });
      rows.push({ label: 'Sum (Sₙ)', value: `n/2(2a₁ + (n-1)d) = ${sumN.toFixed(4)}`, highlight: true });
      seq = Array.from({ length: numN }, (_, i) => numA + i * numD);
    } else if (type === 'geometric') {
      const aN = numA * Math.pow(numD, numN - 1);
      const sumN = numD === 1 ? numA * numN : numA * (1 - Math.pow(numD, numN)) / (1 - numD);
      const sumInf = Math.abs(numD) < 1 ? (numA / (1 - numD)).toFixed(4) : 'Diverges (|r| ≥ 1)';
      rows.push({ label: 'Parameters', value: `a₁ = ${numA}, r = ${numD}` });
      rows.push({ label: 'nᵗʰ term (aₙ)', value: `a₁·r^(n-1) = ${aN.toExponential(4)}`, highlight: true });
      rows.push({ label: 'Sum (Sₙ)', value: sumN.toExponential(4), highlight: true });
      rows.push({ label: 'Sum to infinity (S∞)', value: sumInf });
      seq = Array.from({ length: Math.min(numN, 20) }, (_, i) => numA * Math.pow(numD, i));
    } else {
      seq = [0, 1];
      for (let i = 2; i < numN; i++) seq.push(seq[i - 1] + seq[i - 2]);
      const golden = (seq[seq.length - 1] / seq[seq.length - 2]).toFixed(8);
      rows.push({ label: 'Definition', value: 'F₀ = 0, F₁ = 1, Fₙ = Fₙ₋₁ + Fₙ₋₂' });
      rows.push({ label: `First ${numN} terms`, value: seq.join(', ') });
      rows.push({ label: 'F₍ₙ₋₁₎/F₍ₙ₋₂₎', value: `${golden} (Golden Ratio ≈ 1.618033988...)`, highlight: true });
    }

    setResultRows(rows);
    setSequence(seq);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="S"
        title="Sequences & Series"
        description="Arithmetic, geometric, and Fibonacci sequences"
        gradient="from-teal-500 to-cyan-500"
      />

      <div className="flex gap-2">
        {(['arithmetic', 'geometric', 'fibonacci'] as const).map(t => (
          <Button key={t} variant={type === t ? 'default' : 'outline'} size="sm" onClick={() => { setType(t); setResultRows([]); }} className="h-10 text-xs capitalize">{t}</Button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">{type === 'fibonacci' ? 'Terms (n)' : 'a₁ (first term)'}</label>
                <Input type="number" value={a1} onChange={(e) => setA1(e.target.value)} className="mt-1 h-10 rounded-xl" disabled={type === 'fibonacci'} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{type === 'arithmetic' ? 'd (diff)' : type === 'geometric' ? 'r (ratio)' : 'Terms (n)'}</label>
                <Input type="number" value={d} onChange={(e) => setD(e.target.value)} className="mt-1 h-10 rounded-xl" disabled={type === 'fibonacci'} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">n</label>
                <Input type="number" value={n} onChange={(e) => setN(e.target.value)} className="mt-1 h-10 rounded-xl" />
              </div>
            </div>
            <Button onClick={calculate} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Calculate</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} />

      {sequence.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-3">SEQUENCE</p>
              <div className="flex flex-wrap gap-1.5">
                {sequence.slice(0, 20).map((v, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-mono number-math">{v}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}