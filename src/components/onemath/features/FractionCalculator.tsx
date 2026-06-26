'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import ResultCard from '@/components/onemath/ResultCard';
import { useOneMathStore } from '@/stores/onemath-store';

// ── Core Math Functions ──

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function simplifyFrac(num: number, den: number): [number, number] {
  if (den === 0) return [num, den];
  const g = gcd(Math.abs(num), Math.abs(den));
  let sNum = num / g;
  let sDen = den / g;
  if (sDen < 0) {
    sNum = -sNum;
    sDen = -sDen;
  }
  return [sNum, sDen];
}

function fracToDecimal(num: number, den: number): number {
  return den === 0 ? NaN : num / den;
}

function toMixed(num: number, den: number): [number, number, number] {
  if (den === 0) return [0, 0, 1];
  const [sn, sd] = simplifyFrac(num, den);
  const whole = Math.trunc(sn / sd);
  const remainder = Math.abs(sn % sd);
  return [whole, remainder, sd];
}

function fromMixed(whole: number, num: number, den: number): [number, number] {
  if (den === 0) return [whole, 1];
  const sign = whole < 0 ? -1 : 1;
  return [(Math.abs(whole) * den + num) * sign, den];
}

// ── Fraction Display Helper ──

function FractionDisplay({ num, den, label, color = 'emerald' }: { num: number; den: number; label?: string; color?: string }) {
  const [sn, sd] = simplifyFrac(num, den);
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    violet: 'text-violet-600 dark:text-violet-400',
  };
  const cls = colorMap[color] || colorMap.emerald;
  const barColor: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
  };
  const barCls = barColor[color] || barColor.emerald;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {label && <span className="text-[10px] text-muted-foreground font-medium">{label}</span>}
      <div
        className="flex flex-col items-center leading-none"
        style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
      >
        <span className={`text-xl font-bold ${cls}`}>{sn}</span>
        <div className={`w-10 h-0.5 ${barCls} rounded-full`} />
        <span className={`text-xl font-bold ${cls}`}>{sd}</span>
      </div>
      <FractionBar num={sn} den={sd} color={barCls} />
    </div>
  );
}

// ── Visual Fraction Bar ──

function FractionBar({ num, den, color = 'bg-emerald-500' }: { num: number; den: number; color?: string }) {
  const pct = den === 0 ? 0 : Math.min(100, Math.max(0, (Math.abs(num) / Math.abs(den)) * 100));
  return (
    <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Input Styles ──

const inputCls =
  'w-full h-10 px-3 rounded-xl bg-muted/60 border border-border text-sm text-foreground text-center outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 dark:bg-muted/40';

const labelCls = 'text-[11px] text-muted-foreground font-medium';

// ── Mode Tabs ──

const modes = [
  { id: 'arithmetic', label: 'Arithmetic' },
  { id: 'simplify', label: 'Simplify' },
  { id: 'mixed', label: 'Mixed Number' },
  { id: 'compare', label: 'Compare' },
] as const;

type Mode = (typeof modes)[number]['id'];

// ── Operations ──

const operations = [
  { id: 'add' as const, symbol: '+', label: 'Add' },
  { id: 'sub' as const, symbol: '−', label: 'Subtract' },
  { id: 'mul' as const, symbol: '×', label: 'Multiply' },
  { id: 'div' as const, symbol: '÷', label: 'Divide' },
] as const;

type Op = (typeof operations)[number]['id'];

// ── Main Component ──

export default function FractionCalculator() {
  const [mode, setMode] = useState<Mode>('arithmetic');

  // Arithmetic state
  const [numA, setNumA] = useState('3');
  const [denA, setDenA] = useState('4');
  const [numB, setNumB] = useState('1');
  const [denB, setDenB] = useState('2');
  const [op, setOp] = useState<Op>('add');

  // Simplify state
  const [sNum, setSNum] = useState('24');
  const [sDen, setSDen] = useState('36');

  // Mixed state
  const [mixMode, setMixMode] = useState<'toMixed' | 'fromMixed'>('toMixed');
  const [impNum, setImpNum] = useState('7');
  const [impDen, setImpDen] = useState('3');
  const [mixWhole, setMixWhole] = useState('2');
  const [mixNum, setMixNum] = useState('1');
  const [mixDen, setMixDen] = useState('3');

  // Compare state
  const [cNumA, setCNumA] = useState('3');
  const [cDenA, setCDenA] = useState('5');
  const [cNumB, setCNumB] = useState('2');
  const [cDenB, setCDenB] = useState('3');

  // Results
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [visualData, setVisualData] = useState<{
    fracA?: [number, number];
    fracB?: [number, number];
    result?: [number, number];
    colorA?: string;
    colorB?: string;
    colorResult?: string;
  }>({});

  const { addToHistory } = useOneMathStore();

  // ── Arithmetic Calculate ──

  const calculateArithmetic = () => {
    const a = parseInt(numA),
      b = parseInt(denA),
      c = parseInt(numB),
      d = parseInt(denB);
    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d) || b === 0 || d === 0) {
      setResultRows([{ label: 'Error', value: 'Invalid input or zero denominator', highlight: false }]);
      return;
    }

    let rNum = 0;
    let rDen = 1;
    const stepList: string[] = [];
    const opSym = operations.find((o) => o.id === op)!.symbol;

    if (op === 'add') {
      const l = lcm(b, d);
      const mA = l / b;
      const mB = l / d;
      rNum = a * mA + c * mB;
      rDen = l;
      stepList.push(`Step 1: Find LCD = lcm(${b}, ${d}) = ${l}`);
      stepList.push(`Step 2: Multiply: ${a} × ${mA}/${mA} = ${a * mA}/${l}`);
      stepList.push(`Step 3: Multiply: ${c} × ${mB}/${mB} = ${c * mB}/${l}`);
      stepList.push(`Step 4: Add numerators: ${a * mA} + ${c * mB} = ${rNum}`);
      stepList.push(`Step 5: Result = ${rNum}/${rDen}`);
    } else if (op === 'sub') {
      const l = lcm(b, d);
      const mA = l / b;
      const mB = l / d;
      rNum = a * mA - c * mB;
      rDen = l;
      stepList.push(`Step 1: Find LCD = lcm(${b}, ${d}) = ${l}`);
      stepList.push(`Step 2: Multiply: ${a} × ${mA}/${mA} = ${a * mA}/${l}`);
      stepList.push(`Step 3: Multiply: ${c} × ${mB}/${mB} = ${c * mB}/${l}`);
      stepList.push(`Step 4: Subtract numerators: ${a * mA} − ${c * mB} = ${rNum}`);
      stepList.push(`Step 5: Result = ${rNum}/${rDen}`);
    } else if (op === 'mul') {
      rNum = a * c;
      rDen = b * d;
      stepList.push(`Step 1: Multiply numerators: ${a} × ${c} = ${rNum}`);
      stepList.push(`Step 2: Multiply denominators: ${b} × ${d} = ${rDen}`);
      stepList.push(`Step 3: Result = ${rNum}/${rDen}`);
    } else if (op === 'div') {
      rNum = a * d;
      rDen = b * c;
      stepList.push(`Step 1: Invert second fraction: ${c}/${d} → ${d}/${c}`);
      stepList.push(`Step 2: Multiply: ${a}/${b} × ${d}/${c}`);
      stepList.push(`Step 3: Numerator: ${a} × ${d} = ${rNum}`);
      stepList.push(`Step 4: Denominator: ${b} × ${c} = ${rDen}`);
      stepList.push(`Step 5: Result = ${rNum}/${rDen}`);
    }

    const [sN, sD] = simplifyFrac(rNum, rDen);
    const decimal = fracToDecimal(sN, sD);
    const [w, r, d2] = toMixed(sN, sD);

    stepList.push(`Step 6: GCD(${Math.abs(rNum)}, ${Math.abs(rDen)}) = ${gcd(Math.abs(rNum), Math.abs(rDen))}`);
    stepList.push(`Simplified: ${sN}/${sD}`);

    const rows: { label: string; value: string; highlight?: boolean }[] = [
      { label: 'Expression', value: `${a}/${b} ${opSym} ${c}/${d}` },
      { label: 'Result (Simplified)', value: `${sN}/${sD}`, highlight: true },
      { label: 'Decimal', value: Number.isFinite(decimal) ? decimal.toFixed(6).replace(/\.?0+$/, '') : 'Undefined' },
    ];
    if (w !== 0 || r !== 0) {
      rows.push({ label: 'Mixed Number', value: r === 0 ? `${w}` : `${w} ${r}/${d2}` });
    }

    setResultRows(rows);
    setSteps(stepList);
    setVisualData({
      fracA: [a, b],
      fracB: [c, d],
      result: [sN, sD],
      colorA: 'bg-amber-500',
      colorB: 'bg-violet-500',
      colorResult: 'bg-emerald-500',
    });
    addToHistory({
      type: 'Fraction Calc',
      input: `${a}/${b} ${opSym} ${c}/${d}`,
      output: `${sN}/${sD} = ${Number.isFinite(decimal) ? decimal.toFixed(4).replace(/\.?0+$/, '') : '?'}`,
    });
  };

  // ── Simplify Calculate ──

  const calculateSimplify = () => {
    const n = parseInt(sNum),
      d = parseInt(sDen);
    if (isNaN(n) || isNaN(d) || d === 0) {
      setResultRows([{ label: 'Error', value: 'Invalid input or zero denominator' }]);
      setSteps([]);
      setVisualData({});
      return;
    }

    const g = gcd(Math.abs(n), Math.abs(d));
    const [sN, sD] = simplifyFrac(n, d);
    const decimal = fracToDecimal(sN, sD);

    const stepList: string[] = [
      `Original fraction: ${n}/${d}`,
      `Find GCD(${Math.abs(n)}, ${Math.abs(d)}) using Euclidean algorithm:`,
    ];

    // Show Euclidean steps
    let a = Math.abs(n),
      b = Math.abs(d);
    while (b !== 0) {
      const q = Math.floor(a / b);
      const r = a % b;
      stepList.push(`  gcd(${a}, ${b}) → ${a} = ${q} × ${b} + ${r}`);
      [a, b] = [b, r];
    }
    stepList.push(`  GCD = ${g}`);
    stepList.push(`Divide both by ${g}: ${n}÷${g} / ${d}÷${g} = ${sN}/${sD}`);
    if (Number.isFinite(decimal)) {
      stepList.push(`Decimal: ${decimal}`);
    }

    const [w, r, d2] = toMixed(sN, sD);
    const rows: { label: string; value: string; highlight?: boolean }[] = [
      { label: 'Original', value: `${n}/${d}` },
      { label: 'GCD', value: `${g}`, highlight: false },
      { label: 'Simplified', value: `${sN}/${sD}`, highlight: true },
      { label: 'Decimal', value: Number.isFinite(decimal) ? decimal.toFixed(6).replace(/\.?0+$/, '') : 'Undefined' },
    ];
    if (w !== 0 || r !== 0) {
      rows.push({ label: 'Mixed Number', value: r === 0 ? `${w}` : `${w} ${r}/${d2}` });
    }

    setResultRows(rows);
    setSteps(stepList);
    setVisualData({
      fracA: [n, d],
      result: [sN, sD],
      colorA: 'bg-amber-500',
      colorResult: 'bg-emerald-500',
    });
    addToHistory({ type: 'Simplify', input: `${n}/${d}`, output: `${sN}/${sD}` });
  };

  // ── Mixed Number Calculate ──

  const calculateMixed = () => {
    if (mixMode === 'toMixed') {
      const n = parseInt(impNum),
        d = parseInt(impDen);
      if (isNaN(n) || isNaN(d) || d === 0) {
        setResultRows([{ label: 'Error', value: 'Invalid input or zero denominator' }]);
        setSteps([]);
        setVisualData({});
        return;
      }
      const [w, r, d2] = toMixed(n, d);
      const [sN, sD] = simplifyFrac(n, d);
      const decimal = fracToDecimal(sN, sD);

      const stepList: string[] = [
        `Improper fraction: ${n}/${d}`,
        `Divide ${n} ÷ ${d} = ${Math.trunc(n / d)} remainder ${Math.abs(n % d)}`,
        `Whole number: ${w}, Remainder: ${r}, Denominator: ${d2}`,
        `Mixed number: ${r === 0 ? `${w}` : `${w}  ${r}/${d2}`}`,
      ];

      setResultRows([
        { label: 'Improper Fraction', value: `${sN}/${sD}` },
        { label: 'Whole Number', value: `${w}` },
        { label: 'Remainder / Denominator', value: `${r}/${d2}`, highlight: true },
        { label: 'Mixed Number', value: r === 0 ? `${w}` : `${w}  ${r}/${d2}`, highlight: true },
        { label: 'Decimal', value: Number.isFinite(decimal) ? decimal.toFixed(6).replace(/\.?0+$/, '') : 'Undefined' },
      ]);
      setSteps(stepList);
      setVisualData({
        fracA: [sN, sD],
        result: [r, d2],
        colorA: 'bg-amber-500',
        colorResult: 'bg-emerald-500',
      });
      addToHistory({ type: 'Mixed', input: `${n}/${d}`, output: r === 0 ? `${w}` : `${w} ${r}/${d2}` });
    } else {
      const w = parseInt(mixWhole),
        n = parseInt(mixNum),
        d = parseInt(mixDen);
      if (isNaN(w) || isNaN(n) || isNaN(d) || d === 0) {
        setResultRows([{ label: 'Error', value: 'Invalid input or zero denominator' }]);
        setSteps([]);
        setVisualData({});
        return;
      }
      const [rN, rD] = fromMixed(w, n, d);
      const [sN, sD] = simplifyFrac(rN, rD);
      const decimal = fracToDecimal(sN, sD);

      const stepList: string[] = [
        `Mixed number: ${w}  ${n}/${d}`,
        `Convert to improper: (|${w}| × ${d} + ${n}) / ${d}`,
        `= (${Math.abs(w) * d} + ${n}) / ${d} = ${Math.abs(w) * d + n}/${d}`,
        w < 0 ? `Apply sign: -${Math.abs(w) * d + n}/${d}` : `Result: ${Math.abs(w) * d + n}/${d}`,
      ];
      if (gcd(Math.abs(rN), Math.abs(rD)) > 1) {
        stepList.push(`Simplified: ${sN}/${sD}`);
      }

      setResultRows([
        { label: 'Mixed Number', value: `${w}  ${n}/${d}` },
        { label: 'Improper Fraction', value: `${sN}/${sD}`, highlight: true },
        { label: 'Decimal', value: Number.isFinite(decimal) ? decimal.toFixed(6).replace(/\.?0+$/, '') : 'Undefined' },
      ]);
      setSteps(stepList);
      setVisualData({
        fracA: [rN, rD],
        result: [sN, sD],
        colorA: 'bg-amber-500',
        colorResult: 'bg-emerald-500',
      });
      addToHistory({ type: 'Mixed', input: `${w} ${n}/${d}`, output: `${sN}/${sD}` });
    }
  };

  // ── Compare Calculate ──

  const calculateCompare = () => {
    const a = parseInt(cNumA),
      b = parseInt(cDenA),
      c = parseInt(cNumB),
      d = parseInt(cDenB);
    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d) || b === 0 || d === 0) {
      setResultRows([{ label: 'Error', value: 'Invalid input or zero denominator' }]);
      setSteps([]);
      setVisualData({});
      return;
    }

    const decA = fracToDecimal(a, b);
    const decB = fracToDecimal(c, d);
    const l = lcm(b, d);
    const mA = l / b;
    const mB = l / d;
    const crossA = a * d;
    const crossB = c * b;

    let relation: string;
    let highlightIdx: number | null = null;
    if (Math.abs(decA - decB) < 1e-12) {
      relation = '=';
    } else if (decA > decB) {
      relation = '>';
      highlightIdx = 0;
    } else {
      relation = '<';
      highlightIdx = 1;
    }

    const [sA, sDA] = simplifyFrac(a, b);
    const [sB, sDB] = simplifyFrac(c, d);

    const stepList: string[] = [
      `Fraction A: ${sA}/${sDA} = ${decA.toFixed(6).replace(/\.?0+$/, '')}`,
      `Fraction B: ${sB}/${sDB} = ${decB.toFixed(6).replace(/\.?0+$/, '')}`,
      `Cross multiply: ${a} × ${d} = ${crossA}, ${c} × ${b} = ${crossB}`,
      `${crossA} ${relation} ${crossB}`,
      `Therefore: ${sA}/${sDA} ${relation} ${sB}/${sDB}`,
    ];
    if (l > 1) {
      stepList.push(`Common denominator: ${l} → ${sA * (l / sDA)}/${l} vs ${sB * (l / sDB)}/${l}`);
    }

    setResultRows([
      {
        label: 'Fraction A',
        value: `${sA}/${sDA}`,
        highlight: highlightIdx === 0,
      },
      { label: 'A (decimal)', value: decA.toFixed(6).replace(/\.?0+$/, '') },
      {
        label: 'Relation',
        value: `${sA}/${sDA} ${relation} ${sB}/${sDB}`,
        highlight: true,
      },
      {
        label: 'Fraction B',
        value: `${sB}/${sDB}`,
        highlight: highlightIdx === 1,
      },
      { label: 'B (decimal)', value: decB.toFixed(6).replace(/\.?0+$/, '') },
      { label: 'Difference', value: `${Math.abs(decA - decB).toFixed(6).replace(/\.?0+$/, '')}` },
    ]);
    setSteps(stepList);
    setVisualData({
      fracA: [sA, sDA],
      fracB: [sB, sDB],
      colorA: highlightIdx === 0 ? 'bg-emerald-500' : 'bg-amber-500',
      colorB: highlightIdx === 1 ? 'bg-emerald-500' : 'bg-violet-500',
    });
    addToHistory({
      type: 'Compare',
      input: `${a}/${b} vs ${c}/${d}`,
      output: `${sA}/${sDA} ${relation} ${sB}/${sDB}`,
    });
  };

  // ── Master Calculate ──

  const handleCalculate = () => {
    switch (mode) {
      case 'arithmetic':
        calculateArithmetic();
        break;
      case 'simplify':
        calculateSimplify();
        break;
      case 'mixed':
        calculateMixed();
        break;
      case 'compare':
        calculateCompare();
        break;
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="½"
        title="Fraction Calculator"
        description="Add, subtract, multiply, divide fractions visually"
      />

      {/* Mode Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-1.5 p-1 bg-muted/60 rounded-xl"
      >
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setResultRows([]);
              setSteps([]);
              setVisualData({});
            }}
            className={`flex-1 py-2 px-2 text-[11px] font-semibold rounded-lg transition-all ${
              mode === m.id
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
      </motion.div>

      {/* Input Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── Arithmetic Mode ── */}
          {mode === 'arithmetic' && (
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <CardContent className="p-4 space-y-4">
                {/* Fraction A */}
                <div>
                  <p className={labelCls + ' mb-2 text-center'}>Fraction A</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={numA}
                      onChange={(e) => setNumA(e.target.value)}
                      className={inputCls}
                      placeholder="3"
                      aria-label="Numerator A"
                    />
                    <div
                      className="text-lg text-muted-foreground font-light select-none"
                      style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                    >
                      /
                    </div>
                    <input
                      type="number"
                      value={denA}
                      onChange={(e) => setDenA(e.target.value)}
                      className={inputCls}
                      placeholder="4"
                      aria-label="Denominator A"
                    />
                  </div>
                  <div className="mt-2">
                    <FractionBar
                      num={parseInt(numA) || 0}
                      den={parseInt(denA) || 1}
                      color="bg-amber-500"
                    />
                  </div>
                </div>

                {/* Operation Selector */}
                <div className="flex gap-2 justify-center">
                  {operations.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setOp(o.id)}
                      className={`w-11 h-11 rounded-xl text-lg font-bold transition-all ${
                        op === o.id
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }`}
                      style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                      aria-label={o.label}
                      title={o.label}
                    >
                      {o.symbol}
                    </button>
                  ))}
                </div>

                {/* Fraction B */}
                <div>
                  <p className={labelCls + ' mb-2 text-center'}>Fraction B</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={numB}
                      onChange={(e) => setNumB(e.target.value)}
                      className={inputCls}
                      placeholder="1"
                      aria-label="Numerator B"
                    />
                    <div
                      className="text-lg text-muted-foreground font-light select-none"
                      style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                    >
                      /
                    </div>
                    <input
                      type="number"
                      value={denB}
                      onChange={(e) => setDenB(e.target.value)}
                      className={inputCls}
                      placeholder="2"
                      aria-label="Denominator B"
                    />
                  </div>
                  <div className="mt-2">
                    <FractionBar
                      num={parseInt(numB) || 0}
                      den={parseInt(denB) || 1}
                      color="bg-violet-500"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCalculate}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
                >
                  Calculate
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Simplify Mode ── */}
          {mode === 'simplify' && (
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className={labelCls + ' mb-2 text-center'}>Enter Fraction</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={sNum}
                      onChange={(e) => setSNum(e.target.value)}
                      className={inputCls}
                      placeholder="24"
                      aria-label="Numerator"
                    />
                    <div
                      className="text-lg text-muted-foreground font-light select-none"
                      style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                    >
                      /
                    </div>
                    <input
                      type="number"
                      value={sDen}
                      onChange={(e) => setSDen(e.target.value)}
                      className={inputCls}
                      placeholder="36"
                      aria-label="Denominator"
                    />
                  </div>
                  <div className="mt-2">
                    <FractionBar
                      num={parseInt(sNum) || 0}
                      den={parseInt(sDen) || 1}
                      color="bg-amber-500"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCalculate}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
                >
                  Simplify Fraction
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Mixed Number Mode ── */}
          {mode === 'mixed' && (
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <CardContent className="p-4 space-y-4">
                {/* Sub-mode toggle */}
                <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl">
                  <button
                    onClick={() => setMixMode('toMixed')}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                      mixMode === 'toMixed'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Improper → Mixed
                  </button>
                  <button
                    onClick={() => setMixMode('fromMixed')}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                      mixMode === 'fromMixed'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Mixed → Improper
                  </button>
                </div>

                {mixMode === 'toMixed' ? (
                  <div>
                    <p className={labelCls + ' mb-2 text-center'}>Improper Fraction</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={impNum}
                        onChange={(e) => setImpNum(e.target.value)}
                        className={inputCls}
                        placeholder="7"
                        aria-label="Numerator"
                      />
                      <div
                        className="text-lg text-muted-foreground font-light select-none"
                        style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                      >
                        /
                      </div>
                      <input
                        type="number"
                        value={impDen}
                        onChange={(e) => setImpDen(e.target.value)}
                        className={inputCls}
                        placeholder="3"
                        aria-label="Denominator"
                      />
                    </div>
                    <div className="mt-2">
                      <FractionBar
                        num={parseInt(impNum) || 0}
                        den={parseInt(impDen) || 1}
                        color="bg-amber-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className={labelCls + ' mb-2 text-center'}>Mixed Number</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={mixWhole}
                        onChange={(e) => setMixWhole(e.target.value)}
                        className={inputCls + ' flex-1'}
                        placeholder="2"
                        aria-label="Whole number"
                      />
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="number"
                          value={mixNum}
                          onChange={(e) => setMixNum(e.target.value)}
                          className={inputCls + ' w-20'}
                          placeholder="1"
                          aria-label="Numerator"
                        />
                        <div className="w-16 h-0.5 bg-muted-foreground/40 rounded-full" />
                        <input
                          type="number"
                          value={mixDen}
                          onChange={(e) => setMixDen(e.target.value)}
                          className={inputCls + ' w-20'}
                          placeholder="3"
                          aria-label="Denominator"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCalculate}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
                >
                  Convert
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Compare Mode ── */}
          {mode === 'compare' && (
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <CardContent className="p-4 space-y-4">
                {/* Fraction A */}
                <div>
                  <p className={labelCls + ' mb-2 text-center'}>Fraction A</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={cNumA}
                      onChange={(e) => setCNumA(e.target.value)}
                      className={inputCls}
                      placeholder="3"
                      aria-label="Compare numerator A"
                    />
                    <div
                      className="text-lg text-muted-foreground font-light select-none"
                      style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                    >
                      /
                    </div>
                    <input
                      type="number"
                      value={cDenA}
                      onChange={(e) => setCDenA(e.target.value)}
                      className={inputCls}
                      placeholder="5"
                      aria-label="Compare denominator A"
                    />
                  </div>
                  <div className="mt-2">
                    <FractionBar
                      num={parseInt(cNumA) || 0}
                      den={parseInt(cDenA) || 1}
                      color="bg-amber-500"
                    />
                  </div>
                </div>

                {/* VS */}
                <div className="text-center">
                  <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                    VS
                  </span>
                </div>

                {/* Fraction B */}
                <div>
                  <p className={labelCls + ' mb-2 text-center'}>Fraction B</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={cNumB}
                      onChange={(e) => setCNumB(e.target.value)}
                      className={inputCls}
                      placeholder="2"
                      aria-label="Compare numerator B"
                    />
                    <div
                      className="text-lg text-muted-foreground font-light select-none"
                      style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                    >
                      /
                    </div>
                    <input
                      type="number"
                      value={cDenB}
                      onChange={(e) => setCDenB(e.target.value)}
                      className={inputCls}
                      placeholder="3"
                      aria-label="Compare denominator B"
                    />
                  </div>
                  <div className="mt-2">
                    <FractionBar
                      num={parseInt(cNumB) || 0}
                      den={parseInt(cDenB) || 1}
                      color="bg-violet-500"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCalculate}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
                >
                  Compare
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Visual Fraction Bars */}
      {visualData && (visualData.fracA || visualData.fracB || visualData.result) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                Visual Representation
              </p>
              <div className="flex items-end justify-around gap-4">
                {visualData.fracA && (
                  <div className="flex-1">
                    <FractionDisplay
                      num={visualData.fracA[0]}
                      den={visualData.fracA[1]}
                      label={mode === 'compare' ? 'Fraction A' : mode === 'arithmetic' ? 'Fraction A' : 'Original'}
                      color={mode === 'compare' && resultRows[0]?.highlight ? 'emerald' : 'amber'}
                    />
                  </div>
                )}
                {visualData.fracB && (
                  <div className="flex-1">
                    <FractionDisplay
                      num={visualData.fracB[0]}
                      den={visualData.fracB[1]}
                      label={mode === 'compare' ? 'Fraction B' : 'Fraction B'}
                      color={mode === 'compare' && resultRows[3]?.highlight ? 'emerald' : 'violet'}
                    />
                  </div>
                )}
                {visualData.result && (
                  <div className="flex-1">
                    <FractionDisplay
                      num={visualData.result[0]}
                      den={visualData.result[1]}
                      label={mode === 'compare' ? undefined : 'Result'}
                      color="emerald"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results */}
      <ResultCard title="Results" rows={resultRows} />

      {/* Step-by-Step Solution */}
      {steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
                Step-by-Step Solution
              </p>
              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className={`text-sm leading-relaxed ${
                      i === steps.length - 1
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-muted-foreground'
                    }`}
                    style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', 'Times New Roman', serif" }}
                  >
                    {step}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}