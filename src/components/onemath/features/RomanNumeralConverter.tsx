'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

const romanMap: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function toRoman(n: number): string {
  if (n <= 0 || n >= 4000) return 'Out of range (1-3999)';
  let result = '';
  for (const [val, sym] of romanMap) { while (n >= val) { result += sym; n -= val; } }
  return result;
}

function fromRoman(s: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let result = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]];
    if (next && cur < next) result -= cur; else result += cur;
  }
  return result;
}

export default function RomanNumeralConverter() {
  const [arabic, setArabic] = useState('2024');
  const [roman, setRoman] = useState('');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const convert = () => {
    const num = parseInt(arabic);
    const toR = num ? toRoman(num) : '';
    const toA = roman ? fromRoman(roman.toUpperCase()).toString() : '';
    const rows: { label: string; value: string; highlight?: boolean }[] = [];

    if (num) {
      rows.push({ label: `${arabic} in Roman`, value: toR, highlight: true });
      for (const [val, sym] of romanMap) {
        if (val >= 1000 || (num >= val && val >= 1)) {
          const count = Math.floor(num / val);
          if (count > 0) rows.push({ label: sym, value: `${val} × ${count} = ${val * count}` });
        }
      }
    }
    if (roman) {
      rows.push({ label: `${roman.toUpperCase()} in Arabic`, value: toA, highlight: true });
    }

    setResultRows(rows);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="Ⅳ"
        title="Roman Numeral Converter"
        description="Roman ↔ Arabic with breakdown"
        gradient="from-rose-500 to-pink-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Arabic → Roman</label>
              <div className="flex gap-2 mt-1">
                <Input type="number" value={arabic} onChange={(e) => setArabic(e.target.value)} placeholder="e.g. 2024" className="h-10 rounded-xl" />
                <Button variant="outline" size="sm" onClick={() => setArabic(String(fromRoman(roman.toUpperCase())))} className="shrink-0 h-10 text-xs">↑ Use Roman</Button>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Roman → Arabic</label>
              <div className="flex gap-2 mt-1">
                <Input value={roman} onChange={(e) => setRoman(e.target.value)} placeholder="e.g. MMXXIV" className="h-10 rounded-xl" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }} />
                <Button variant="outline" size="sm" onClick={() => setRoman(toRoman(parseInt(arabic) || 0))} className="shrink-0 h-10 text-xs">↑ Use Arabic</Button>
              </div>
            </div>
            <Button onClick={convert} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Convert</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Result" rows={resultRows} />
    </div>
  );
}