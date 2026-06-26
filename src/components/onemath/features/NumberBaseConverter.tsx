'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function NumberBaseConverter() {
  const [value, setValue] = useState('255');
  const [fromBase, setFromBase] = useState('10');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const convert = () => {
    const v = value.trim();
    const base = parseInt(fromBase);
    try {
      const decimal = parseInt(v, base);
      if (isNaN(decimal)) { setResultRows([{ label: 'Error', value: 'Invalid number for given base' }]); return; }
      setResultRows([
        { label: 'Decimal (base 10)', value: decimal.toString(), highlight: true },
        { label: 'Binary (base 2)', value: decimal.toString(2), highlight: true },
        { label: 'Octal (base 8)', value: decimal.toString(8) },
        { label: 'Hexadecimal (base 16)', value: decimal.toString(16).toUpperCase() },
        { label: 'Base 3', value: decimal.toString(3) },
        { label: 'Base 5', value: decimal.toString(5) },
        { label: 'Base 7', value: decimal.toString(7) },
        { label: 'Base 36', value: decimal.toString(36).toUpperCase() },
      ]);
    } catch {
      setResultRows([{ label: 'Error', value: 'Conversion failed' }]);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="2️⃣"
        title="Number Base Converter"
        description="Binary, octal, decimal, hex, and more"
        gradient="from-cyan-500 to-teal-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Value</label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 h-10 rounded-xl" placeholder="Enter number" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[2, 8, 10, 16].map(b => (
                <Button key={b} variant={fromBase === String(b) ? 'default' : 'outline'} size="sm" onClick={() => setFromBase(String(b))} className="h-10 text-xs">Base {b}</Button>
              ))}
            </div>
            <Button onClick={convert} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Convert</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} />
    </div>
  );
}