'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function LogarithmCalculator() {
  const [value, setValue] = useState('100');
  const [base, setBase] = useState('10');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const calculate = () => {
    const v = parseFloat(value), b = parseFloat(base);
    if (isNaN(v) || v <= 0) { setResultRows([{ label: 'Error', value: 'Value must be positive' }]); return; }
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    rows.push({ label: `log${b}(${v})`, value: b === 1 ? 'Undefined' : (Math.log(v) / Math.log(b)).toFixed(8), highlight: true });
    rows.push({ label: `ln(${v})`, value: Math.log(v).toFixed(8) });
    rows.push({ label: `log₁₀(${v})`, value: Math.log10(v).toFixed(8) });
    rows.push({ label: `log₂(${v})`, value: Math.log2(v).toFixed(8) });
    rows.push({ label: `e^${v}`, value: Math.exp(v).toExponential(6) });
    rows.push({ label: `10^${v}`, value: Math.pow(10, v).toExponential(6) });
    rows.push({ label: `2^${v}`, value: Math.pow(2, v).toExponential(6) });
    if (v > 0 && b > 0 && b !== 1) {
      rows.push({ label: 'Change of base', value: `ln(${v})/ln(${b}) = ${(Math.log(v) / Math.log(b)).toFixed(8)}` });
    }
    setResultRows(rows);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="log"
        title="Logarithm Calculator"
        description="log, ln, exp, and change of base"
        gradient="from-orange-500 to-amber-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Value</label><Input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 h-10 rounded-xl" /></div>
              <div><label className="text-xs text-muted-foreground">Base (for log)</label><Input type="number" value={base} onChange={(e) => setBase(e.target.value)} className="mt-1 h-10 rounded-xl" /></div>
            </div>
            <Button onClick={calculate} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Calculate</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} />
    </div>
  );
}