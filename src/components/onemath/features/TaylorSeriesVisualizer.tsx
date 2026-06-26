'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import ResultCard from '@/components/onemath/ResultCard';
import KaTeXRenderer from '@/components/onemath/KaTeXRenderer';
import { Play, Pause, RotateCcw } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────
function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function niceNum(range: number, round: boolean): number {
  if (range <= 0) return 1;
  const exp = Math.floor(Math.log10(range));
  const frac = range / Math.pow(10, exp);
  let nice: number;
  if (round) {
    if (frac < 1.5) nice = 1;
    else if (frac < 3) nice = 2;
    else if (frac < 7) nice = 5;
    else nice = 10;
  } else {
    if (frac <= 1) nice = 1;
    else if (frac <= 2) nice = 2;
    else if (frac <= 5) nice = 5;
    else nice = 10;
  }
  return nice * Math.pow(10, exp);
}

function computeTicks(min: number, max: number, maxTicks = 6): number[] {
  const range = niceNum(max - min, false);
  const step = niceNum(range / (maxTicks - 1), true);
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) {
    ticks.push(parseFloat(v.toPrecision(10)));
  }
  return ticks;
}

// ─── Preset Definitions ──────────────────────────────────────────────
interface Preset {
  label: string;
  latex: string;
  getCoeff: (k: number, a: number) => number;
  fn: (x: number) => number;
  seriesLatex: string;
}

const presets: Preset[] = [
  {
    label: 'sin(x)',
    latex: '\\sin(x)',
    getCoeff: (k, a) => Math.sin(a + (k * Math.PI) / 2) / factorial(k),
    fn: (x) => Math.sin(x),
    seriesLatex: '\\sin(x) = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\cdots',
  },
  {
    label: 'cos(x)',
    latex: '\\cos(x)',
    getCoeff: (k, a) => Math.cos(a + (k * Math.PI) / 2) / factorial(k),
    fn: (x) => Math.cos(x),
    seriesLatex: '\\cos(x) = 1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} - \\cdots',
  },
  {
    label: 'eˣ',
    latex: 'e^x',
    getCoeff: (k, a) => Math.exp(a) / factorial(k),
    fn: (x) => Math.exp(x),
    seriesLatex: 'e^x = 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + \\cdots',
  },
  {
    label: 'ln(1+x)',
    latex: '\\ln(1+x)',
    getCoeff: (k) => (k === 0 ? 0 : Math.pow(-1, k + 1) / k),
    fn: (x) => Math.log(1 + x),
    seriesLatex: '\\ln(1+x) = x - \\frac{x^2}{2} + \\frac{x^3}{3} - \\cdots',
  },
  {
    label: '1/(1-x)',
    latex: '\\frac{1}{1-x}',
    getCoeff: () => 1,
    fn: (x) => 1 / (1 - x),
    seriesLatex: '\\frac{1}{1-x} = 1 + x + x^2 + x^3 + \\cdots',
  },
  {
    label: 'arctan(x)',
    latex: '\\arctan(x)',
    getCoeff: (k) => (k % 2 === 0 ? Math.pow(-1, k / 2) / (k + 1) : 0),
    fn: (x) => Math.atan(x),
    seriesLatex: '\\arctan(x) = x - \\frac{x^3}{3} + \\frac{x^5}{5} - \\cdots',
  },
];

// ─── Generate LaTeX for polynomial ────────────────────────────────────
function generatePolyLatex(n: number, a: number, preset: Preset): string {
  const parts: string[] = [];
  let isFirst = true;
  for (let k = 0; k <= n; k++) {
    const coeff = preset.getCoeff(k, a);
    if (Math.abs(coeff) < 1e-14) continue;
    const sign = coeff > 0 ? (isFirst ? '' : '+') : (isFirst ? '-' : '-');
    const absC = Math.abs(coeff);
    let term = '';
    if (k === 0) {
      term = absC === 1 ? '1' : absC.toFixed(4);
    } else if (k === 1) {
      const c = absC === 1 ? '' : absC.toFixed(2);
      term = a === 0 ? `${c}x` : `${c}(x${a >= 0 ? '-' : '+'}${Math.abs(a)})`;
    } else {
      const c = absC === 1 ? '' : absC.toFixed(2);
      const p = a === 0 ? `x^{${k}}` : `(x${a >= 0 ? '-' : '+'}${Math.abs(a)})^{${k}}`;
      term = c ? `${c}${p}` : p;
    }
    parts.push(sign + term);
    isFirst = false;
  }
  return parts.length > 0 ? `T_{${n}}(x) = ${parts.join('')}` : `T_{${n}}(x) = 0`;
}

// ─── SVG Padding ──────────────────────────────────────────────────────
const PAD = { left: 45, right: 15, top: 15, bottom: 30 };
const CHART_H = 280;
const NUM_SAMPLES = 200;

export default function TaylorSeriesVisualizer() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [numTerms, setNumTerms] = useState(5);
  const [expansionPoint, setExpansionPoint] = useState('0');
  const [xMinInput, setXMinInput] = useState('-6');
  const [xMaxInput, setXMaxInput] = useState('6');
  const [animating, setAnimating] = useState(false);
  const [animTerms, setAnimTerms] = useState(5);

  const preset = presets[selectedPreset];
  const a = parseFloat(expansionPoint) || 0;
  const xMin = parseFloat(xMinInput) || -6;
  const xMax = parseFloat(xMaxInput) || 6;
  const displayTerms = animating ? animTerms : numTerms;

  // Taylor polynomial evaluation
  const taylorFn = useCallback(
    (x: number): number => {
      let result = 0;
      for (let k = 0; k <= displayTerms; k++) {
        const coeff = preset.getCoeff(k, a);
        result += coeff * Math.pow(x - a, k);
      }
      return result;
    },
    [preset, displayTerms, a]
  );

  // Sample points
  const samples = useMemo(() => {
    const pts: { x: number; fy: number; ty: number }[] = [];
    for (let i = 0; i <= NUM_SAMPLES; i++) {
      const x = xMin + (xMax - xMin) * (i / NUM_SAMPLES);
      const fy = preset.fn(x);
      const ty = taylorFn(x);
      pts.push({ x, fy: isFinite(fy) ? fy : NaN, ty: isFinite(ty) ? ty : NaN });
    }
    return pts;
  }, [xMin, xMax, preset, taylorFn]);

  // Y range
  const { yMin, yMax } = useMemo(() => {
    const ys: number[] = [];
    for (const p of samples) {
      if (!isNaN(p.fy) && Math.abs(p.fy) < 100) ys.push(p.fy);
      if (!isNaN(p.ty) && Math.abs(p.ty) < 100) ys.push(p.ty);
    }
    if (ys.length === 0) return { yMin: -5, yMax: 5 };
    let mn = Math.min(...ys);
    let mx = Math.max(...ys);
    if (mn === mx) { mn -= 1; mx += 1; }
    const pad = (mx - mn) * 0.12;
    return { yMin: mn - pad, yMax: mx + pad };
  }, [samples]);

  // SVG coordinate transforms
  const chartW = 600 - PAD.left - PAD.right;
  const chartH = CHART_H - PAD.top - PAD.bottom;
  const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin)) * chartW;
  const sy = (y: number) => PAD.top + (1 - (y - yMin) / (yMax - yMin)) * chartH;

  // Build SVG paths
  const fnPath = useMemo(() => {
    let d = '';
    let started = false;
    for (const p of samples) {
      if (isNaN(p.fy) || Math.abs(p.fy) > 200) { started = false; continue; }
      const px = sx(p.x);
      const py = sy(p.fy);
      if (!started) { d += `M ${px} ${py}`; started = true; }
      else { d += ` L ${px} ${py}`; }
    }
    return d;
  }, [samples, sx, sy]);

  const taylorPath = useMemo(() => {
    let d = '';
    let started = false;
    for (const p of samples) {
      if (isNaN(p.ty) || Math.abs(p.ty) > 200) { started = false; continue; }
      const px = sx(p.x);
      const py = sy(p.ty);
      if (!started) { d += `M ${px} ${py}`; started = true; }
      else { d += ` L ${px} ${py}`; }
    }
    return d;
  }, [samples, sx, sy]);

  const xTicks = useMemo(() => computeTicks(xMin, xMax), [xMin, xMax]);
  const yTicks = useMemo(() => computeTicks(yMin, yMax), [yMin, yMax]);

  // Max error
  const maxError = useMemo(() => {
    let err = 0;
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (xMax - xMin) * (i / 200);
      const fy = preset.fn(x);
      const ty = taylorFn(x);
      if (isFinite(fy) && isFinite(ty)) {
        const e = Math.abs(fy - ty);
        if (e > err) err = e;
      }
    }
    return err;
  }, [preset, taylorFn, xMin, xMax]);

  // KaTeX for polynomial
  const polyLatex = useMemo(() => generatePolyLatex(displayTerms, a, preset), [displayTerms, a, preset]);

  // Animation
  const handleAnimate = useCallback(() => {
    if (animating) {
      setAnimating(false);
      return;
    }
    setAnimating(true);
    setAnimTerms(1);
    let current = 1;
    const interval = setInterval(() => {
      current++;
      if (current > numTerms) {
        setAnimTerms(numTerms);
        setAnimating(false);
        clearInterval(interval);
      } else {
        setAnimTerms(current);
      }
    }, 400);
  }, [animating, numTerms]);

  const handleReset = useCallback(() => {
    setAnimating(false);
    setAnimTerms(numTerms);
  }, [numTerms]);

  const zeroX = sx(0);
  const zeroY = sy(0);
  const showZeroX = xMin <= 0 && xMax >= 0;
  const showZeroY = yMin <= 0 && yMax >= 0;

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <FeatureHeader
        icon="Σ"
        title="Taylor Series Visualizer"
        description="Visualize Taylor/Maclaurin polynomial approximations"
        gradient="from-amber-500 to-orange-500"
      />

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p, i) => (
          <motion.button
            key={p.label}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedPreset(i)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              i === selectedPreset
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {p.label}
          </motion.button>
        ))}
      </div>

      {/* Controls */}
      <Card className="bg-card/80 border-border/50">
        <CardContent className="p-4 space-y-3">
          {/* Number of Terms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">Number of Terms</label>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 number-math">
                {displayTerms}
              </span>
            </div>
            <input
              type="range" min={1} max={20} step={1}
              value={displayTerms}
              onChange={(e) => { const v = parseInt(e.target.value); setNumTerms(v); setAnimTerms(v); }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span><span>20</span>
            </div>
          </div>

          {/* Expansion Point & X Range */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Point (a)</label>
              <Input
                type="number" value={expansionPoint}
                onChange={(e) => setExpansionPoint(e.target.value)}
                className="h-9 text-sm number-math"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">X min</label>
              <Input
                type="number" value={xMinInput}
                onChange={(e) => setXMinInput(e.target.value)}
                className="h-9 text-sm number-math"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">X max</label>
              <Input
                type="number" value={xMaxInput}
                onChange={(e) => setXMaxInput(e.target.value)}
                className="h-9 text-sm number-math"
              />
            </div>
          </div>

          {/* Animate / Reset */}
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={handleAnimate}
              className="flex-1 gap-1.5 text-xs"
            >
              {animating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {animating ? 'Pause' : 'Animate'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SVG Chart */}
      <Card className="bg-card/80 border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="w-full" style={{ height: CHART_H }}>
            <svg
              viewBox={`0 0 600 ${CHART_H}`}
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Grid */}
              {xTicks.map((t) => {
                const px = sx(t);
                if (px < PAD.left || px > 600 - PAD.right) return null;
                return (
                  <line key={`gx-${t}`} x1={px} y1={PAD.top} x2={px} y2={CHART_H - PAD.bottom}
                    stroke="currentColor" className="text-border/50" strokeWidth={0.5} />
                );
              })}
              {yTicks.map((t) => {
                const py = sy(t);
                if (py < PAD.top || py > CHART_H - PAD.bottom) return null;
                return (
                  <line key={`gy-${t}`} x1={PAD.left} y1={py} x2={600 - PAD.right} y2={py}
                    stroke="currentColor" className="text-border/50" strokeWidth={0.5} />
                );
              })}

              {/* Zero axes */}
              {showZeroY && (
                <line x1={zeroX} y1={PAD.top} x2={zeroX} y2={CHART_H - PAD.bottom}
                  stroke="currentColor" className="text-foreground/20" strokeWidth={1} />
              )}
              {showZeroX && (
                <line x1={PAD.left} y1={zeroY} x2={600 - PAD.right} y2={zeroY}
                  stroke="currentColor" className="text-foreground/20" strokeWidth={1} />
              )}

              {/* Chart border */}
              <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH}
                fill="none" stroke="currentColor" className="text-foreground/15" strokeWidth={1} />

              {/* Function curve */}
              <path d={fnPath} fill="none" stroke="#10b981" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" />

              {/* Taylor curve */}
              <path d={taylorPath} fill="none" stroke="#f97316" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 4" />

              {/* Expansion point */}
              {a >= xMin && a <= xMax && (
                <circle cx={sx(a)} cy={sy(preset.fn(a))} r={4}
                  fill="#f97316" stroke="white" strokeWidth={2} />
              )}

              {/* X tick labels */}
              {xTicks.map((t) => {
                const px = sx(t);
                if (px < PAD.left + 5 || px > 600 - PAD.right - 5) return null;
                return (
                  <text key={`xl-${t}`} x={px} y={CHART_H - PAD.bottom + 15}
                    textAnchor="middle" className="fill-muted-foreground" fontSize={10}
                    style={{ fontFamily: "'Latin Modern Math', serif" }}>
                    {Number.isInteger(t) ? t.toString() : t.toFixed(1)}
                  </text>
                );
              })}

              {/* Y tick labels */}
              {yTicks.map((t) => {
                const py = sy(t);
                if (py < PAD.top + 5 || py > CHART_H - PAD.bottom - 5) return null;
                return (
                  <text key={`yl-${t}`} x={PAD.left - 6} y={py + 3.5}
                    textAnchor="end" className="fill-muted-foreground" fontSize={10}
                    style={{ fontFamily: "'Latin Modern Math', serif" }}>
                    {Number.isInteger(t) ? t.toString() : t.toFixed(1)}
                  </text>
                );
              })}

              {/* Legend */}
              <g transform={`translate(${600 - PAD.right - 130}, ${PAD.top + 8})`}>
                <rect x={0} y={0} width={122} height={44} rx={6}
                  className="fill-background" stroke="currentColor" strokeWidth={0.5} style={{ opacity: 0.9 }} />
                <line x1={8} y1={14} x2={30} y2={14} stroke="#10b981" strokeWidth={2} />
                <text x={36} y={17.5} className="fill-foreground" fontSize={10}
                  style={{ fontFamily: "'Latin Modern Math', serif" }}>f(x)</text>
                <line x1={8} y1={30} x2={30} y2={30} stroke="#f97316" strokeWidth={2} strokeDasharray="5 3" />
                <text x={36} y={33.5} className="fill-foreground" fontSize={10}
                  style={{ fontFamily: "'Latin Modern Math', serif" }}>
                  T_{displayTerms}(x)
                </text>
              </g>
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Series Formula */}
      <Card className="bg-card/80 border-border/50">
        <CardContent className="p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400 mb-2">
            General Series
          </p>
          <div className="math-display">
            <KaTeXRenderer latex={preset.seriesLatex} />
          </div>
          <div className="separator-subtle my-3" />
          <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400 mb-2">
            Current Polynomial
          </p>
          <div className="math-display">
            <KaTeXRenderer latex={polyLatex} />
          </div>
        </CardContent>
      </Card>

      {/* Result Card */}
      <ResultCard
        title="Analysis"
        KaTeXRenderer={KaTeXRenderer}
        rows={[
          { label: 'Function', value: preset.label },
          { label: 'Expansion Point', value: a === 0 ? '0 (Maclaurin)' : a.toString(), highlight: false },
          { label: 'Terms', value: `${displayTerms}`, highlight: false },
          { label: 'Max Error', value: maxError < 0.0001 ? maxError.toExponential(2) : maxError.toFixed(6), highlight: true },
        ]}
      />
    </div>
  );
}