'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function eulerTotient(n: number): number {
  if (n <= 0) return 0;
  let result = n;
  for (let p = 2; p * p <= n; p++) {
    if (n % p === 0) {
      while (result % p === 0) result /= p;
    }
  }
  return result;
}

function sieveOfEratosthenes(limit: number): number[] {
  const isPrime = new Array(limit + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  for (let i = 2; i * i <= limit; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= limit; j += i) isPrime[j] = false;
    }
  }
  return Array.from({ length: limit + 1 }, (_, i) => i).filter(i => isPrime[i]);
}

function primeFactorization(n: number): { prime: number; power: number }[] {
  const factors: { prime: number; power: number }[] = [];
  for (let p = 2; p * p <= n; p++) {
    while (n % p === 0) {
      const existing = factors.find(f => f.prime === p);
      if (existing) existing.power++;
      else factors.push({ prime: p, power: 1 });
      n /= p;
    }
  }
  if (n > 1) {
    const existing = factors.find(f => f.prime === n);
    if (existing) existing.power++;
    else factors.push({ prime: n, power: 1 });
  }
  return factors;
}

function modularPow(base: number, exp: number, mod: number): number {
  if (mod === 1) return 0;
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

export default function NumberTheoryExplorer() {
  const [mode, setMode] = useState<'divisibility' | 'sieve' | 'euler' | 'factor' | 'modpow'>('divisibility');
  const [input, setInput] = useState('100');
  const [input2, setInput2] = useState('7');
  const [rows, setRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);
  const [sievePrimes, setSievePrimes] = useState<number[]>([]);

  const modes = [
    { id: 'divisibility' as const, label: 'Divisibility', desc: 'Check divisibility by 2-12' },
    { id: 'sieve' as const, label: 'Sieve', desc: 'Primes up to N' },
    { id: 'euler' as const, label: 'Euler φ(n)', desc: "Euler's totient function" },
    { id: 'factor' as const, label: 'Factor', desc: 'Full prime factorization' },
    { id: 'modpow' as const, label: 'Mod Pow', desc: 'a^b mod n' },
  ];

  const calculate = useCallback(() => {
    const n = parseInt(input) || 0;
    if (n <= 0) { setRows([{ label: 'Error', value: 'Enter a positive integer' }]); return; }
    const r: { label: string; value: string; highlight?: boolean }[] = [];

    switch (mode) {
      case 'divisibility': {
        r.push({ label: 'Number', value: n.toString(), highlight: true });
        r.push({ label: 'Divisible by 2 (even)', value: (n % 2 === 0).toString() });
        r.push({ label: 'Divisible by 3', value: (n % 3 === 0).toString() });
        r.push({ label: 'Divisible by 4', value: (n % 4 === 0).toString() });
        r.push({ label: 'Divisible by 5', value: (n % 5 === 0).toString() });
        r.push({ label: 'Divisible by 6 (2&3)', value: (n % 6 === 0).toString() });
        r.push({ label: 'Divisible by 7', value: (n % 7 === 0).toString() });
        r.push({ label: 'Divisible by 8', value: (n % 8 === 0).toString() });
        r.push({ label: 'Divisible by 9', value: (n % 9 === 0).toString() });
        r.push({ label: 'Divisible by 10', value: (n % 10 === 0).toString() });
        r.push({ label: 'Divisible by 11', value: (n % 11 === 0).toString() });
        r.push({ label: 'Divisible by 12', value: (n % 12 === 0).toString() });
        break;
      }
      case 'sieve': {
        const max = Math.min(n, 5000);
        const primes = sieveOfEratosthenes(max);
        setSievePrimes(primes);
        r.push({ label: 'Limit', value: max.toString() });
        r.push({ label: 'Primes found', value: primes.length.toString(), highlight: true });
        r.push({ label: 'Largest prime', value: primes[primes.length - 1]?.toString() || 'none' });
        r.push({ label: 'Sum of primes', value: primes.reduce((a, b) => a + b, 0).toString() });
        if (primes.length >= 2) {
          const gaps = [];
          for (let i = 1; i < Math.min(primes.length, 20); i++) {
            gaps.push(primes[i] - primes[i - 1]);
          }
          r.push({ label: 'Max gap (first 20)', value: Math.max(...gaps).toString() });
        }
        break;
      }
      case 'euler': {
        const phi = eulerTotient(n);
        r.push({ label: 'n', value: n.toString(), highlight: true });
        r.push({ label: 'φ(n)', value: phi.toString(), highlight: true });
        r.push({ label: 'n/φ(n)', value: (n / phi).toFixed(4) });
        r.push({ label: 'n · φ(n)', value: (n * phi).toString() });
        r.push({ label: 'Is n prime?', value: (phi === n - 1).toString() });
        r.push({ label: 'Is n coprime to φ(n)?', value: (gcd(n, phi) === 1).toString() });
        const facs = primeFactorization(n);
        r.push({ label: 'n = ', value: facs.map(f => `${f.prime}^${f.power}`).join(' × ') });
        break;
      }
      case 'factor': {
        const facs = primeFactorization(n);
        r.push({ label: 'n', value: n.toString(), highlight: true });
        r.push({ label: 'Factorization', value: facs.map(f => `${f.prime}^${f.power}`).join(' × ') || '1', highlight: true });
        r.push({ label: 'Number of prime factors', value: facs.length.toString() });
        r.push({ label: 'Is prime?', value: (facs.length === 1 && facs[0].power === 1).toString() });
        const divs = facs.map(f => f.power + 1);
        const totalDivs = divs.reduce((a, b) => a * b, 1);
        r.push({ label: 'Total divisors', value: totalDivs.toString() });
        const divList: number[] = [];
        divsGenerator(n, facs, divList);
        r.push({ label: 'Divisor sum σ(n)', value: divList.reduce((a, b) => a + b, 0).toString() });
        break;
      }
      case 'modpow': {
        const b = parseInt(input2) || 0;
        const m = n;
        const result = modularPow(b, m, m);
        r.push({ label: 'Base (a)', value: b.toString() });
        r.push({ label: 'Exponent (b)', value: m.toString() });
        r.push({ label: 'Modulus (n)', value: m.toString() });
        r.push({ label: `${b}^${m} mod ${n}`, value: result.toString(), highlight: true });
        if (gcd(b, m) === 1) {
          r.push({ label: 'Coprime (gcd=1)?', value: 'Yes ✓' });
          r.push({ label: 'Euler\'s theorem check', value: (result === 1).toString() });
        } else {
          r.push({ label: 'Coprime?', value: `No (gcd=${gcd(b, m)})` });
        }
        break;
      }
    }

    setRows(r);
  }, [mode, input, input2]);

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="ℤ"
        title="Number Theory"
        description="Divisibility, sieve, Euler's totient, modular exponentiation"
        gradient="from-cyan-500 to-teal-600"
      />

      {/* Mode Selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setRows([]); }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              mode === m.id
                ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/25'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-muted/40'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Input Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            {mode === 'modpow' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Base (a)</label>
                  <Input type="number" value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. 2" className="mt-1 h-11 rounded-xl text-center number-math" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Exponent (b)</label>
                  <Input type="number" value={input2} onChange={(e) => setInput2(e.target.value)} placeholder="e.g. 100" className="mt-1 h-11 rounded-xl text-center number-math" />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs text-muted-foreground">
                  {mode === 'sieve' ? 'Upper limit (max 5000)' : 'Enter a positive integer'}
                </label>
                <Input
                  type="number"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'sieve' ? 'e.g. 100' : 'e.g. 360'}
                  className="mt-1 h-11 rounded-xl number-math"
                  onKeyDown={(e) => e.key === 'Enter' && calculate()}
                />
              </div>
            )}
            <Button
              onClick={calculate}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
            >
              Calculate
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {rows.length > 0 && <ResultCard title="Results" rows={rows} />}

      {/* Sieve visualization */}
      {mode === 'sieve' && sievePrimes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-sm border-border/60 overflow-hidden">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 mb-3">
                Prime Grid (first 100)
              </p>
              <div className="flex flex-wrap gap-1">
                {sievePrimes.slice(0, 100).map((p) => (
                  <div
                    key={p}
                    className="w-7 h-7 rounded flex items-center justify-center text-[9px] font-mono number-math bg-muted/50 border border-border/30"
                    style={{ fontFamily: "'Latin Modern Math', serif" }}
                  >
                    {p}
                  </div>
                ))}
              </div>
              {sievePrimes.length > 100 && (
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  ... and {sievePrimes.length - 100} more
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function divsGenerator(n: number, factors: { prime: number; power: number }[], result: number[]) {
  if (factors.length === 0) return;
  const current = Array(factors.length).fill(0);
  function advance() {
    for (let i = factors.length - 1; i >= 0; i--) {
      current[i]++;
      if (current[i] <= factors[i].power) return true;
      current[i] = 0;
    }
    return false;
  }
  let value = 1;
  while (advance()) {
    for (let i = 0; i < factors.length; i++) {
      value *= Math.pow(factors[i].prime, current[i]);
    }
    result.push(value);
  }
}