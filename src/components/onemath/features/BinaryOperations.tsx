'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function BinaryOperations() {
  const [a, setA] = useState('170');
  const [b, setB] = useState('85');
  const [shift, setShift] = useState('2');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const calculate = () => {
    const numA = parseInt(a) || 0, numB = parseInt(b) || 0, s = parseInt(shift) || 0;
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    rows.push({ label: 'A', value: `${numA} = 0b${(numA >>> 0).toString(2).padStart(8, '0')}` });
    rows.push({ label: 'B', value: `${numB} = 0b${(numB >>> 0).toString(2).padStart(8, '0')}` });
    rows.push({ label: 'A AND B', value: `${(numA & numB)} = 0b${((numA & numB) >>> 0).toString(2).padStart(8, '0')}`, highlight: true });
    rows.push({ label: 'A OR B', value: `${(numA | numB)} = 0b${((numA | numB) >>> 0).toString(2).padStart(8, '0')}`, highlight: true });
    rows.push({ label: 'A XOR B', value: `${(numA ^ numB)} = 0b${((numA ^ numB) >>> 0).toString(2).padStart(8, '0')}` });
    rows.push({ label: 'NOT A', value: `${(~numA)} = 0b${((~numA) >>> 0).toString(2).slice(-8)}` });
    rows.push({ label: 'NOT B', value: `${(~numB)} = 0b${((~numB) >>> 0).toString(2).slice(-8)}` });
    rows.push({ label: `A << ${s}`, value: `${numA << s} = 0b${((numA << s) >>> 0).toString(2)}` });
    rows.push({ label: `A >> ${s}`, value: `${numA >> s} = 0b${(numA >> s).toString(2)}` });
    rows.push({ label: `A >>> ${s}`, value: `${numA >>> s} = 0b${(numA >>> s).toString(2)}` });
    setResultRows(rows);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="01"
        title="Binary Operations"
        description="AND, OR, XOR, NOT, left/right shifts"
        gradient="from-teal-500 to-green-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">A (decimal)</label>
                <Input type="number" value={a} onChange={(e) => setA(e.target.value)} className="mt-1 h-10 rounded-xl" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">B (decimal)</label>
                <Input type="number" value={b} onChange={(e) => setB(e.target.value)} className="mt-1 h-10 rounded-xl" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Shift bits</label>
                <Input type="number" value={shift} onChange={(e) => setShift(e.target.value)} className="mt-1 h-10 rounded-xl" />
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