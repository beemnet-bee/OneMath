'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';
import { useOneMathStore } from '@/stores/onemath-store';

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export default function GCDLCMCalculator() {
  const [a, setA] = useState('12');
  const [b, setB] = useState('18');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);
  const { addToHistory } = useOneMathStore();

  const calculate = () => {
    const numA = parseInt(a), numB = parseInt(b);
    if (isNaN(numA) || isNaN(numB)) return;
    const g = gcd(numA, numB);
    const l = lcm(numA, numB);
    setResultRows([
      { label: 'GCD', value: `gcd(${numA}, ${numB}) = ${g}`, highlight: true },
      { label: 'LCM', value: `lcm(${numA}, ${numB}) = ${l}`, highlight: true },
    ]);
    addToHistory({ type: 'GCD/LCM', input: `${numA}, ${numB}`, output: `GCD=${g}, LCM=${l}` });
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="🧮"
        title="GCD & LCM Calculator"
        description="Euclidean algorithm for GCD and LCM"
        gradient="from-violet-500 to-purple-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Number A</label>
                <Input type="number" value={a} onChange={(e) => setA(e.target.value)} className="mt-1 h-10 rounded-xl" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Number B</label>
                <Input type="number" value={b} onChange={(e) => setB(e.target.value)} className="mt-1 h-10 rounded-xl" />
              </div>
            </div>
            <Button onClick={calculate} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Calculate</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} />
    </div>
  );
}