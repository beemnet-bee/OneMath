'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function PercentageCalculator() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const calculate = () => {
    const numA = parseFloat(a), numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return;
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    rows.push({ label: `${numA}% of ${numB}`, value: (numA / 100 * numB).toFixed(4), highlight: true });
    rows.push({ label: `${numA} is what % of ${numB}`, value: `${(numA / numB * 100).toFixed(2)}%` });
    rows.push({ label: '% change', value: `${((numB - numA) / numA * 100).toFixed(2)}%` });
    rows.push({ label: `Increase ${numA} by ${numB}%`, value: (numA * (1 + numB / 100)).toFixed(4) });
    rows.push({ label: `Decrease ${numA} by ${numB}%`, value: (numA * (1 - numB / 100)).toFixed(4) });
    rows.push({ label: `${numA} + ${numB}%`, value: (numA + numA * numB / 100).toFixed(4) });
    rows.push({ label: `${numA} - ${numB}%`, value: (numA - numA * numB / 100).toFixed(4) });
    setResultRows(rows);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="%"
        title="Percentage Calculator"
        description="7 percentage operations in one click"
        gradient="from-lime-500 to-green-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Value A</label><Input type="number" value={a} onChange={(e) => setA(e.target.value)} className="mt-1 h-10 rounded-xl" placeholder="e.g. 25" /></div>
              <div><label className="text-xs text-muted-foreground">Value B</label><Input type="number" value={b} onChange={(e) => setB(e.target.value)} className="mt-1 h-10 rounded-xl" placeholder="e.g. 200" /></div>
            </div>
            <Button onClick={calculate} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Calculate All</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} />
    </div>
  );
}