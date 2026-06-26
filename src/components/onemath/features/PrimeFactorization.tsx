'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

function primeFactors(n: number): Map<number, number> {
  const factors = new Map<number, number>();
  for (let d = 2; d * d <= n; d++) {
    while (n % d === 0) { factors.set(d, (factors.get(d) || 0) + 1); n /= d; }
  }
  if (n > 1) factors.set(n, 1);
  return factors;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export default function PrimeFactorization() {
  const [num, setNum] = useState('360');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const calculate = () => {
    const n = parseInt(num);
    if (isNaN(n) || n < 2) { setResultRows([{ label: 'Error', value: 'Enter a number ≥ 2' }]); return; }
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    rows.push({ label: `${n} is prime?`, value: isPrime(n) ? '✅ PRIME' : '❌ NOT prime', highlight: true });
    const factors = primeFactors(n);
    const factorStr = Array.from(factors.entries()).map(([p, e]) => e > 1 ? `${p}^${e}` : `${p}`).join(' × ');
    rows.push({ label: 'Prime factorization', value: factorStr, highlight: true });
    const expanded = Array.from(factors.entries()).flatMap(([p, e]) => Array(e).fill(p)).join(' × ');
    rows.push({ label: 'Expanded', value: expanded });
    let divs = 1;
    factors.forEach(e => divs *= (e + 1));
    rows.push({ label: 'Number of divisors', value: String(divs) });
    rows.push({ label: `Euler's totient φ(${n})`, value: String(n) });
    const sum = Array.from(factors.keys()).reduce((a, b) => a + b, 0);
    rows.push({ label: 'Sum of prime factors', value: String(sum) });
    setResultRows(rows);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="🔢"
        title="Prime Factorization"
        description="Full factorization with Euler's totient"
        gradient="from-yellow-500 to-amber-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div><label className="text-xs text-muted-foreground">Number (≥ 2)</label><Input type="number" value={num} onChange={(e) => setNum(e.target.value)} className="mt-1 h-10 rounded-xl" /></div>
            <Button onClick={calculate} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Factorize</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} />
    </div>
  );
}