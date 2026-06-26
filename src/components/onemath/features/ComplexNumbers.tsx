'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function ComplexNumbers() {
  const [realA, setRealA] = useState('1');
  const [imagA, setImagA] = useState('2');
  const [realB, setRealB] = useState('3');
  const [imagB, setImagB] = useState('4');
  const [rows, setRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const fmt = (r: number, i: number) => {
    if (i === 0) return r.toFixed(4);
    if (r === 0) return i === 1 ? 'i' : i === -1 ? '-i' : `${i.toFixed(4)}i`;
    const sign = i > 0 ? '+' : '-';
    return `${r.toFixed(4)} ${sign} ${Math.abs(i) === 1 ? '' : Math.abs(i).toFixed(4)}i`;
  };

  const calculate = () => {
    const a = { r: parseFloat(realA) || 0, i: parseFloat(imagA) || 0 };
    const b = { r: parseFloat(realB) || 0, i: parseFloat(imagB) || 0 };

    const add = { r: a.r + b.r, i: a.i + b.i };
    const sub = { r: a.r - b.r, i: a.i - b.i };
    const mul = { r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r };
    const divDenom = b.r * b.r + b.i * b.i;
    const div = divDenom === 0 ? { r: NaN, i: NaN } : {
      r: (a.r * b.r + a.i * b.i) / divDenom,
      i: (a.i * b.r - a.r * b.i) / divDenom,
    };
    const modA = Math.sqrt(a.r * a.r + a.i * a.i);
    const argA = Math.atan2(a.i, a.r) * 180 / Math.PI;
    const conjA = { r: a.r, i: -a.i };
    const pow2 = { r: a.r * a.r - a.i * a.i, i: 2 * a.r * a.i };

    setRows([
      { label: 'z₁', value: fmt(a.r, a.i) },
      { label: 'z₂', value: fmt(b.r, b.i) },
      { label: 'z₁ + z₂', value: fmt(add.r, add.i), highlight: true },
      { label: 'z₁ − z₂', value: fmt(sub.r, sub.i), highlight: true },
      { label: 'z₁ × z₂', value: fmt(mul.r, mul.i), highlight: true },
      { label: 'z₁ ÷ z₂', value: isNaN(div.r) ? 'Undefined (÷ by 0)' : fmt(div.r, div.i) },
      { label: '|z₁| (modulus)', value: modA.toFixed(6), highlight: true },
      { label: 'arg(z₁)', value: `${argA.toFixed(4)}°` },
      { label: 'z̄₁ (conjugate)', value: fmt(conjA.r, conjA.i) },
      { label: 'z₁²', value: fmt(pow2.r, pow2.i) },
      { label: 'Polar z₁', value: `${modA.toFixed(4)} ∠ ${argA.toFixed(2)}°` },
    ]);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader icon="∞" title="Complex Numbers" description="Full operations on complex numbers" gradient="from-rose-500 to-red-500" />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">z₁ = a + bi</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Real (a)</label>
                  <Input value={realA} onChange={(e) => setRealA(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <span className="text-lg font-bold text-muted-foreground mt-4" style={{ fontFamily: "'Latin Modern Math', serif" }}>+</span>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Imag (b)</label>
                  <Input value={imagA} onChange={(e) => setImagA(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <span className="text-lg font-bold text-muted-foreground mt-4" style={{ fontFamily: "'Latin Modern Math', serif" }}>i</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">z₂ = c + di</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Real (c)</label>
                  <Input value={realB} onChange={(e) => setRealB(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <span className="text-lg font-bold text-muted-foreground mt-4" style={{ fontFamily: "'Latin Modern Math', serif" }}>+</span>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Imag (d)</label>
                  <Input value={imagB} onChange={(e) => setImagB(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <span className="text-lg font-bold text-muted-foreground mt-4" style={{ fontFamily: "'Latin Modern Math', serif" }}>i</span>
              </div>
            </div>

            <Button
              onClick={calculate}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
            >
              Calculate All Operations
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {rows.length > 0 && <ResultCard title="Complex Results" rows={rows} />}
    </div>
  );
}