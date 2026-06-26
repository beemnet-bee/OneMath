'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function NumberProperties() {
  const [num, setNum] = useState('42');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  function isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) if (n % i === 0 || n % (i + 2) === 0) return false;
    return true;
  }

  function isPerfectSquare(n: number): boolean { return Math.sqrt(n) === Math.floor(Math.sqrt(n)); }
  function isPerfectCube(n: number): boolean { return Math.cbrt(n) === Math.floor(Math.cbrt(n)); }
  function isPalindrome(n: number): boolean { return n.toString() === n.toString().split('').reverse().join(''); }
  function digitSum(n: number): number { return Math.abs(n).toString().split('').reduce((a, b) => a + parseInt(b), 0); }
  function digitProduct(n: number): number { return Math.abs(n).toString().split('').reduce((a, b) => a * parseInt(b), 1); }
  function isFibonacci(n: number): boolean { return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4); }
  function isPowerOf2(n: number): boolean { return n > 0 && (n & (n - 1)) === 0; }
  function isHarshad(n: number): boolean { return n > 0 && n % digitSum(n) === 0; }
  function collatz(n: number): number { let c = 0, x = Math.abs(n); while (x !== 1 && c < 1000) { x = x % 2 === 0 ? x / 2 : 3 * x + 1; c++; } return c; }

  const analyze = () => {
    const n = parseInt(num);
    if (isNaN(n)) return;
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    rows.push({ label: 'Even', value: n % 2 === 0 ? '✅ Yes' : '❌ No' });
    rows.push({ label: 'Odd', value: n % 2 !== 0 ? '✅ Yes' : '❌ No' });
    rows.push({ label: 'Positive', value: n > 0 ? '✅ Yes' : '❌ No' });
    rows.push({ label: 'Negative', value: n < 0 ? '✅ Yes' : '❌ No' });
    rows.push({ label: 'Prime', value: isPrime(Math.abs(n)) ? '✅ Yes' : '❌ No', highlight: true });
    rows.push({ label: 'Perfect Square', value: isPerfectSquare(Math.abs(n)) ? `✅ Yes (√${Math.abs(n)} = ${Math.sqrt(Math.abs(n))})` : '❌ No' });
    rows.push({ label: 'Perfect Cube', value: isPerfectCube(Math.abs(n)) ? `✅ Yes (∛${Math.abs(n)} = ${Math.cbrt(Math.abs(n))})` : '❌ No' });
    rows.push({ label: 'Fibonacci', value: isFibonacci(n) ? '✅ Yes' : '❌ No', highlight: true });
    rows.push({ label: 'Palindrome', value: isPalindrome(Math.abs(n)) ? '✅ Yes' : '❌ No' });
    rows.push({ label: 'Power of 2', value: isPowerOf2(n) ? '✅ Yes' : '❌ No' });
    rows.push({ label: 'Harshad', value: isHarshad(Math.abs(n)) ? '✅ Yes' : '❌ No' });
    rows.push({ label: 'Digit Sum', value: digitSum(n).toString() });
    rows.push({ label: 'Digit Product', value: digitProduct(n).toString() });
    rows.push({ label: 'Digit Count', value: Math.abs(n).toString().length.toString() });
    rows.push({ label: 'Square Root', value: Math.sqrt(Math.abs(n)).toFixed(6) });
    rows.push({ label: 'Cube Root', value: Math.cbrt(Math.abs(n)).toFixed(6) });
    rows.push({ label: 'Binary', value: (n >>> 0).toString(2) });
    rows.push({ label: 'Hex', value: (n >>> 0).toString(16).toUpperCase() });
    rows.push({ label: 'Octal', value: (n >>> 0).toString(8) });
    rows.push({ label: 'Collatz Steps', value: collatz(n).toString() });
    setResultRows(rows);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="🔢"
        title="Number Properties"
        description="17 properties: prime, even, Fibonacci, palindrome, and more"
        gradient="from-amber-500 to-yellow-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <Input type="number" value={num} onChange={(e) => setNum(e.target.value)} placeholder="Enter a number" className="h-10 rounded-xl" />
            <Button onClick={analyze} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Analyze Properties</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title={`Properties of ${num}`} rows={resultRows} />
    </div>
  );
}