'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluate } from 'mathjs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import KaTeXRenderer from '@/components/onemath/KaTeXRenderer';

// ─── Types ────────────────────────────────────────────────────────────
type CurveMode = 'parametric' | 'polar' | 'implicit';

interface ParametricPreset {
  label: string;
  xExpr: string;
  yExpr: string;
  tMin: string;
  tMax: string;
  latex: string;
}

interface PolarPreset {
  label: string;
  rExpr: string;
  thetaMin: string;
  thetaMax: string;
  latex: string;
}

interface ImplicitPreset {
  label: string;
  expr: string;
  latex: string;
}

interface Point2D {
  x: number;
  y: number;
}

// ─── Presets ──────────────────────────────────────────────────────────
const parametricPresets: ParametricPreset[] = [
  { label: 'Circle', xExpr: 'cos(t)', yExpr: 'sin(t)', tMin: '0', tMax: '6.2832', latex: '\\begin{cases} x = \\cos t \\\\ y = \\sin t \\end{cases}' },
  { label: 'Ellipse', xExpr: '2*cos(t)', yExpr: 'sin(t)', tMin: '0', tMax: '6.2832', latex: '\\begin{cases} x = 2\\cos t \\\\ y = \\sin t \\end{cases}' },
  { label: 'Cycloid', xExpr: 't - sin(t)', yExpr: '1 - cos(t)', tMin: '0', tMax: '12.5664', latex: '\\begin{cases} x = t - \\sin t \\\\ y = 1 - \\cos t \\end{cases}' },
  { label: 'Lissajous', xExpr: 'sin(3*t)', yExpr: 'sin(2*t)', tMin: '0', tMax: '6.2832', latex: '\\begin{cases} x = \\sin 3t \\\\ y = \\sin 2t \\end{cases}' },
  { label: 'Spiral', xExpr: 't/10 * cos(t)', yExpr: 't/10 * sin(t)', tMin: '0', tMax: '31.416', latex: '\\begin{cases} x = \\frac{t}{10}\\cos t \\\\ y = \\frac{t}{10}\\sin t \\end{cases}' },
];

const polarPresets: PolarPreset[] = [
  { label: 'Circle', rExpr: '2', thetaMin: '0', thetaMax: '6.2832', latex: 'r = 2' },
  { label: 'Cardioid', rExpr: '1 + cos(theta)', thetaMin: '0', thetaMax: '6.2832', latex: 'r = 1 + \\cos\\theta' },
  { label: 'Rose 3', rExpr: '2*sin(3*theta)', thetaMin: '0', thetaMax: '6.2832', latex: 'r = 2\\sin 3\\theta' },
  { label: 'Rose 4', rExpr: '2*cos(2*theta)', thetaMin: '0', thetaMax: '6.2832', latex: 'r = 2\\cos 2\\theta' },
  { label: 'Lemniscate', rExpr: 'sqrt(abs(4*cos(2*theta)))', thetaMin: '0', thetaMax: '6.2832', latex: 'r^2 = 4\\cos 2\\theta' },
  { label: 'Spiral', rExpr: 'theta/4', thetaMin: '0', thetaMax: '31.416', latex: 'r = \\frac{\\theta}{4}' },
];

const implicitPresets: ImplicitPreset[] = [
  { label: 'Circle', expr: 'x^2 + y^2 - 25', latex: 'x^2 + y^2 = 25' },
  { label: 'Ellipse', expr: 'x^2/9 + y^2/4 - 1', latex: '\\frac{x^2}{9} + \\frac{y^2}{4} = 1' },
  { label: 'Hyperbola', expr: 'x^2/4 - y^2/4 - 1', latex: '\\frac{x^2}{4} - \\frac{y^2}{4} = 1' },
  { label: 'Lemniscate', expr: '(x^2 + y^2)^2 - 4*(x^2 - y^2)', latex: '(x^2+y^2)^2 = 4(x^2-y^2)' },
];

const NUM_POINTS = 600;
const IMPLICIT_GRID = 200;

// ─── Helpers ──────────────────────────────────────────────────────────
function safeEval(expr: string, scope: Record<string, number>): number {
  try {
    const result = evaluate(expr, scope);
    return typeof result === 'number' && isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}

function computeParametric(xExpr: string, yExpr: string, tMin: number, tMax: number): Point2D[] {
  const points: Point2D[] = [];
  const dt = (tMax - tMin) / NUM_POINTS;
  const scope: Record<string, number> = { e: Math.E, pi: Math.PI };
  for (let i = 0; i <= NUM_POINTS; i++) {
    scope.t = tMin + i * dt;
    const x = safeEval(xExpr, scope);
    const y = safeEval(yExpr, scope);
    if (!isNaN(x) && !isNaN(y) && Math.abs(x) < 1e6 && Math.abs(y) < 1e6) {
      points.push({ x, y });
    } else {
      points.push({ x: NaN, y: NaN });
    }
  }
  return points;
}

function computePolar(rExpr: string, thetaMin: number, thetaMax: number): Point2D[] {
  const points: Point2D[] = [];
  const dt = (thetaMax - thetaMin) / NUM_POINTS;
  const scope: Record<string, number> = { e: Math.E, pi: Math.PI };
  for (let i = 0; i <= NUM_POINTS; i++) {
    const theta = thetaMin + i * dt;
    scope.theta = theta;
    scope.t = theta;
    const r = safeEval(rExpr, scope);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    if (!isNaN(x) && !isNaN(y) && Math.abs(x) < 1e6 && Math.abs(y) < 1e6) {
      points.push({ x, y });
    } else {
      points.push({ x: NaN, y: NaN });
    }
  }
  return points;
}

// ─── Marching Squares for Implicit Curves ─────────────────────────────
function computeImplicit(expr: string, xMin: number, xMax: number, yMin: number, yMax: number): Point2D[] {
  const cols = IMPLICIT_GRID;
  const rows = IMPLICIT_GRID;
  const dx = (xMax - xMin) / cols;
  const dy = (yMax - yMin) / rows;
  const scope: Record<string, number> = { e: Math.E, pi: Math.PI };

  // Evaluate grid
  const grid: number[][] = [];
  for (let j = 0; j <= rows; j++) {
    grid[j] = [];
    for (let i = 0; i <= cols; i++) {
      scope.x = xMin + i * dx;
      scope.y = yMax - j * dy;
      grid[j][i] = safeEval(expr, scope);
    }
  }

  const segments: Point2D[] = [];

  // Linear interpolation helper
  function lerp(va: number, vb: number, a: number, b: number): number {
    if (Math.abs(va - vb) < 1e-12) return (a + b) / 2;
    return a + (0 - va) * (b - a) / (vb - va);
  }

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const tl = grid[j][i] >= 0 ? 1 : 0;
      const tr = grid[j][i + 1] >= 0 ? 1 : 0;
      const br = grid[j + 1][i + 1] >= 0 ? 1 : 0;
      const bl = grid[j + 1][i] >= 0 ? 1 : 0;
      const idx = tl * 8 + tr * 4 + br * 2 + bl;
      if (idx === 0 || idx === 15) continue;

      const x0 = xMin + i * dx;
      const x1 = xMin + (i + 1) * dx;
      const y0 = yMax - j * dy;
      const y1 = yMax - (j + 1) * dy;

      const top = { x: lerp(grid[j][i], grid[j][i + 1], x0, x1), y: y0 };
      const right = { x: x1, y: lerp(grid[j][i + 1], grid[j + 1][i + 1], y0, y1) };
      const bottom = { x: lerp(grid[j + 1][i], grid[j + 1][i + 1], x0, x1), y: y1 };
      const left = { x: x0, y: lerp(grid[j][i], grid[j + 1][i], y0, y1) };

      const addSeg = (a: Point2D, b: Point2D) => {
        segments.push(a, { x: NaN, y: NaN } as Point2D, b);
      };

      switch (idx) {
        case 1: case 14: addSeg(left, bottom); break;
        case 2: case 13: addSeg(bottom, right); break;
        case 3: case 12: addSeg(left, right); break;
        case 4: case 11: addSeg(top, right); break;
        case 5: addSeg(left, top); addSeg(bottom, right); break;
        case 6: case 9: addSeg(top, bottom); break;
        case 7: case 8: addSeg(left, top); break;
        case 10: addSeg(top, right); addSeg(left, bottom); break;
      }
    }
  }
  return segments;
}

// ─── Path builder (splits on NaN gaps) ────────────────────────────────
function buildPath(points: Point2D[]): string {
  let d = '';
  let penDown = false;
  for (const pt of points) {
    if (isNaN(pt.x) || isNaN(pt.y)) {
      penDown = false;
      continue;
    }
    if (!penDown) {
      d += `M${pt.x.toFixed(4)},${pt.y.toFixed(4)}`;
      penDown = true;
    } else {
      d += `L${pt.x.toFixed(4)},${pt.y.toFixed(4)}`;
    }
  }
  return d;
}

// ─── Component ────────────────────────────────────────────────────────
export default function CurvePlotter() {
  // Mode
  const [mode, setMode] = useState<CurveMode>('parametric');

  // Parametric state
  const [xExpr, setXExpr] = useState('cos(t)');
  const [yExpr, setYExpr] = useState('sin(t)');
  const [tMin, setTMin] = useState('0');
  const [tMax, setTMax] = useState('6.2832');

  // Polar state
  const [rExpr, setRExpr] = useState('1 + cos(theta)');
  const [thetaMin, setThetaMin] = useState('0');
  const [thetaMax, setThetaMax] = useState('6.2832');

  // Implicit state
  const [implicitExpr, setImplicitExpr] = useState('x^2 + y^2 - 25');

  // View
  const [viewMin, setViewMin] = useState(-5);
  const [viewMax, setViewMax] = useState(5);
  const [showGrid, setShowGrid] = useState(true);
  const [showPolarGrid, setShowPolarGrid] = useState(true);
  // Derive error from inputs (pure computed value, no setState)
  const error = useMemo((): string => {
    try {
      if (mode === 'parametric') {
        const t0 = parseFloat(tMin) || 0;
        const t1 = parseFloat(tMax) || 0;
        if (t0 >= t1) return 't_min must be less than t_max';
        computeParametric(xExpr, yExpr, t0, t1);
        return '';
      } else if (mode === 'polar') {
        const th0 = parseFloat(thetaMin) || 0;
        const th1 = parseFloat(thetaMax) || 0;
        if (th0 >= th1) return 'θ_min must be less than θ_max';
        computePolar(rExpr, th0, th1);
        return '';
      } else {
        const pts = computeImplicit(implicitExpr, viewMin, viewMax, viewMin, viewMax);
        if (pts.length < 2) return 'No curve found in current view';
        return '';
      }
    } catch (_e) {
      return 'Error evaluating expression';
    }
  }, [mode, xExpr, yExpr, tMin, tMax, rExpr, thetaMin, thetaMax, implicitExpr, viewMin, viewMax]);

  // Compute curve points
  const curvePath = useMemo((): string => {
    if (error) return '';
    try {
      if (mode === 'parametric') {
        const t0 = parseFloat(tMin) || 0;
        const t1 = parseFloat(tMax) || 0;
        const pts = computeParametric(xExpr, yExpr, t0, t1);
        return buildPath(pts);
      } else if (mode === 'polar') {
        const th0 = parseFloat(thetaMin) || 0;
        const th1 = parseFloat(thetaMax) || 0;
        const pts = computePolar(rExpr, th0, th1);
        return buildPath(pts);
      } else {
        const pts = computeImplicit(implicitExpr, viewMin, viewMax, viewMin, viewMax);
        return buildPath(pts);
      }
    } catch (_e) {
      return '';
    }
  }, [mode, xExpr, yExpr, tMin, tMax, rExpr, thetaMin, thetaMax, implicitExpr, viewMin, viewMax, error]);

  // KaTeX display for current input
  const currentLatex = useMemo((): string => {
    if (mode === 'parametric') {
      return `\\begin{cases} x = \\text{${xExpr}} \\\\ y = \\text{${yExpr}} \\end{cases}`;
    } else if (mode === 'polar') {
      return `r = \\text{${rExpr}}`;
    } else {
      return `\\text{${implicitExpr}} = 0`;
    }
  }, [mode, xExpr, yExpr, rExpr, implicitExpr]);

  // Preset loader
  const loadParametricPreset = useCallback((p: ParametricPreset) => {
    setMode('parametric');
    setXExpr(p.xExpr);
    setYExpr(p.yExpr);
    setTMin(p.tMin);
    setTMax(p.tMax);
    setViewMin(-5);
    setViewMax(5);
  }, []);

  const loadPolarPreset = useCallback((p: PolarPreset) => {
    setMode('polar');
    setRExpr(p.rExpr);
    setThetaMin(p.thetaMin);
    setThetaMax(p.thetaMax);
    setViewMin(-5);
    setViewMax(5);
  }, []);

  const loadImplicitPreset = useCallback((p: ImplicitPreset) => {
    setMode('implicit');
    setImplicitExpr(p.expr);
    setViewMin(-6);
    setViewMax(6);
  }, []);

  const reset = useCallback(() => {
    setMode('parametric');
    setXExpr('cos(t)');
    setYExpr('sin(t)');
    setTMin('0');
    setTMax('6.2832');
    setRExpr('1 + cos(theta)');
    setThetaMin('0');
    setThetaMax('6.2832');
    setImplicitExpr('x^2 + y^2 - 25');
    setViewMin(-5);
    setViewMax(5);
    setError('');
  }, []);

  // ─── SVG dimensions ────────────────────────────────────────────────
  const vbX = viewMin;
  const vbY = -viewMax;
  const vbW = viewMax - viewMin;
  const vbH = viewMax - viewMin;
  const viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;

  // ─── Grid tick helper ──────────────────────────────────────────────
  const ticks = useMemo(() => {
    const step = vbW > 20 ? 2 : vbW > 8 ? 1 : vbW > 3 ? 0.5 : 0.25;
    const result: number[] = [];
    for (let v = Math.ceil(viewMin / step) * step; v <= viewMax; v += step) {
      result.push(Math.round(v * 1000) / 1000);
    }
    return result;
  }, [viewMin, viewMax, vbW]);

  // ─── Polar grid circles ────────────────────────────────────────────
  const polarGridCircles = useMemo(() => {
    if (mode !== 'polar' || !showPolarGrid) return null;
    const maxR = vbW / 2;
    const step = maxR > 10 ? 2 : maxR > 4 ? 1 : 0.5;
    const circles: number[] = [];
    for (let r = step; r <= maxR; r += step) {
      circles.push(r);
    }
    return circles;
  }, [mode, showPolarGrid, vbW]);

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="〰"
        title="Curve Plotter"
        description="Parametric, polar & implicit curves"
      />

      {/* Mode Tabs */}
      <div className="flex gap-1 bg-muted/60 rounded-xl p-1">
        {(['parametric', 'polar', 'implicit'] as CurveMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
              mode === m
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {m === 'implicit' ? 'F(x,y)=0' : m}
          </button>
        ))}
      </div>

      {/* Equation Display in KaTeX */}
      <motion.div
        key={`katex-${mode}`}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center py-2"
      >
        <KaTeXRenderer latex={currentLatex} displayMode className="text-base" />
      </motion.div>

      {/* SVG Plot */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Card className="overflow-hidden border-emerald-200/40 dark:border-emerald-800/30 shadow-sm">
          <CardContent className="p-0">
            <svg
              viewBox={viewBox}
              className="w-full"
              style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif", maxHeight: 420 }}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="0.15" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background */}
              <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="hsl(var(--card))" />

              {/* Cartesian Grid */}
              {showGrid && ticks.map((v) => (
                <g key={v}>
                  <line
                    x1={v} y1={vbY} x2={v} y2={vbY + vbH}
                    stroke="hsl(var(--border))" strokeWidth={vbW > 15 ? 0.02 : 0.03} opacity={0.5}
                  />
                  <line
                    x1={vbX} y1={v} x2={vbX + vbW} y2={v}
                    stroke="hsl(var(--border))" strokeWidth={vbW > 15 ? 0.02 : 0.03} opacity={0.5}
                  />
                </g>
              ))}

              {/* Polar Grid (when in polar mode) */}
              {polarGridCircles?.map((r) => (
                <circle
                  key={`pc-${r}`}
                  cx={0} cy={0} r={r}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth={0.025}
                  opacity={0.35}
                  strokeDasharray={`${0.08} ${0.08}`}
                />
              ))}
              {mode === 'polar' && showPolarGrid && (
                <g opacity={0.25} stroke="hsl(var(--border))" strokeWidth={0.02} strokeDasharray={`${0.06} ${0.06}`}>
                  {[0, Math.PI / 6, Math.PI / 3, Math.PI / 2, 2 * Math.PI / 3, 5 * Math.PI / 6, Math.PI, 7 * Math.PI / 6, 4 * Math.PI / 3, 3 * Math.PI / 2, 5 * Math.PI / 3, 11 * Math.PI / 6].map((a) => {
                    const len = vbW;
                    return (
                      <line
                        key={a}
                        x1={-len * Math.cos(a)} y1={-len * Math.sin(a)}
                        x2={len * Math.cos(a)} y2={len * Math.sin(a)}
                      />
                    );
                  })}
                </g>
              )}

              {/* Axes with arrows */}
              <line x1={vbX} y1={0} x2={vbX + vbW} y2={0} stroke="hsl(var(--muted-foreground))" strokeWidth={0.06} />
              <line x1={0} y1={vbY} x2={0} y2={vbY + vbH} stroke="hsl(var(--muted-foreground))" strokeWidth={0.06} />
              {/* X arrow */}
              <polygon points={`${vbX + vbW - 0.1},0.12 ${vbX + vbW},0 ${vbX + vbW - 0.1},-0.12`} fill="hsl(var(--muted-foreground))" />
              {/* Y arrow */}
              <polygon points={`-0.12,${vbY + vbH - 0.1} 0,${vbY + vbH} 0.12,${vbY + vbH - 0.1}`} fill="hsl(var(--muted-foreground))" />

              {/* Tick marks and labels */}
              {ticks.filter((v) => Math.abs(v) > 0.001).map((v) => {
                const tickLen = vbW > 15 ? 0.08 : 0.12;
                const fontSize = vbW > 15 ? 0.28 : vbW > 8 ? 0.35 : 0.45;
                return (
                  <g key={`tick-${v}`}>
                    {/* X-axis ticks */}
                    <line x1={v} y1={-tickLen} x2={v} y2={tickLen} stroke="hsl(var(--muted-foreground))" strokeWidth={0.04} />
                    <text x={v} y={-tickLen - 0.15} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={fontSize} style={{ fontFamily: "'Latin Modern Math', serif" }}>
                      {v % 1 === 0 ? v.toString() : v.toFixed(1)}
                    </text>
                    {/* Y-axis ticks */}
                    <line x1={-tickLen} y1={v} x2={tickLen} y2={v} stroke="hsl(var(--muted-foreground))" strokeWidth={0.04} />
                    <text x={-tickLen - 0.15} y={v + fontSize * 0.3} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={fontSize} style={{ fontFamily: "'Latin Modern Math', serif" }}>
                      {v % 1 === 0 ? v.toString() : v.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Origin label */}
              <text x={-0.2} y={0.2} fill="hsl(var(--muted-foreground))" fontSize={0.3} style={{ fontFamily: "'Latin Modern Math', serif" }}>0</text>

              {/* The Curve */}
              {curvePath && (
                <path
                  d={curvePath}
                  fill="none"
                  stroke="url(#curveGrad)"
                  strokeWidth={0.06}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
              )}
            </svg>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 border border-red-200/60 dark:border-red-800/40"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* View Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-muted-foreground font-medium">View:</label>
          <Input
            type="number"
            value={viewMin}
            onChange={(e) => setViewMin(Number(e.target.value))}
            className="w-[4.5rem] h-7 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="number"
            value={viewMax}
            onChange={(e) => setViewMax(Number(e.target.value))}
            className="w-[4.5rem] h-7 text-xs"
          />
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-medium transition-colors ${
            showGrid
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
              : 'bg-muted/60 text-muted-foreground border border-transparent hover:bg-muted'
          }`}
        >
          Grid
        </button>
        {mode === 'polar' && (
          <button
            onClick={() => setShowPolarGrid(!showPolarGrid)}
            className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-medium transition-colors ${
              showPolarGrid
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                : 'bg-muted/60 text-muted-foreground border border-transparent hover:bg-muted'
            }`}
          >
            Polar
          </button>
        )}
        <Button variant="ghost" size="icon" onClick={reset} title="Reset" className="h-7 w-7 text-muted-foreground">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </Button>
      </div>

      {/* Input Fields */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.15 }}
          className="space-y-3"
        >
          {mode === 'parametric' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">x(t) =</label>
                  <Input
                    value={xExpr}
                    onChange={(e) => setXExpr(e.target.value)}
                    placeholder="cos(t)"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">y(t) =</label>
                  <Input
                    value={yExpr}
                    onChange={(e) => setYExpr(e.target.value)}
                    placeholder="sin(t)"
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-muted-foreground font-medium">t:</label>
                  <Input type="number" value={tMin} onChange={(e) => setTMin(e.target.value)} className="w-20 h-7 text-xs" />
                  <span className="text-xs text-muted-foreground">→</span>
                  <Input type="number" value={tMax} onChange={(e) => setTMax(e.target.value)} className="w-20 h-7 text-xs" />
                </div>
              </div>
            </>
          )}

          {mode === 'polar' && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">r(θ) =</label>
                <Input
                  value={rExpr}
                  onChange={(e) => setRExpr(e.target.value)}
                  placeholder="1 + cos(theta)"
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-muted-foreground font-medium">θ:</label>
                  <Input type="number" value={thetaMin} onChange={(e) => setThetaMin(e.target.value)} className="w-20 h-7 text-xs" />
                  <span className="text-xs text-muted-foreground">→</span>
                  <Input type="number" value={thetaMax} onChange={(e) => setThetaMax(e.target.value)} className="w-20 h-7 text-xs" />
                </div>
              </div>
            </>
          )}

          {mode === 'implicit' && (
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">F(x, y) = 0 where F =</label>
              <Input
                value={implicitExpr}
                onChange={(e) => setImplicitExpr(e.target.value)}
                placeholder="x^2 + y^2 - 25"
                className="h-9 text-sm font-mono"
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Preset Curves */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Presets</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap gap-1.5"
          >
            {mode === 'parametric' && parametricPresets.map((p) => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                onClick={() => loadParametricPreset(p)}
                className="h-7 text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all duration-200"
              >
                <span style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>{p.label}</span>
              </Button>
            ))}
            {mode === 'polar' && polarPresets.map((p) => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                onClick={() => loadPolarPreset(p)}
                className="h-7 text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all duration-200"
              >
                <span style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>{p.label}</span>
              </Button>
            ))}
            {mode === 'implicit' && implicitPresets.map((p) => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                onClick={() => loadImplicitPreset(p)}
                className="h-7 text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all duration-200"
              >
                <span style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>{p.label}</span>
              </Button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Info Cards for each mode */}
      <Card className="border-border/40">
        <CardContent className="py-3 px-4 space-y-1.5">
          <AnimatePresence mode="wait">
            {mode === 'parametric' && (
              <motion.div key="p-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                <p className="text-[11px] font-semibold text-foreground">Parametric Curves</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Define x and y as functions of parameter t. Use <code className="text-emerald-600 dark:text-emerald-400 font-mono">sin(t)</code>,{' '}
                  <code className="text-emerald-600 dark:text-emerald-400 font-mono">cos(t)</code>,{' '}
                  <code className="text-emerald-600 dark:text-emerald-400 font-mono">t^2</code>, etc.{' '}
                  Supports <code className="text-emerald-600 dark:text-emerald-400 font-mono">pi</code> and <code className="text-emerald-600 dark:text-emerald-400 font-mono">e</code> constants.
                </p>
                <KaTeXRenderer latex="\\begin{pmatrix} x(t) \\\\ y(t) \\end{pmatrix}, \\quad t \\in [t_{\\min},\\, t_{\\max}]" displayMode={false} className="text-sm mt-1" />
              </motion.div>
            )}
            {mode === 'polar' && (
              <motion.div key="o-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                <p className="text-[11px] font-semibold text-foreground">Polar Curves</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Define r as a function of θ. The variable is <code className="text-emerald-600 dark:text-emerald-400 font-mono">theta</code> (or <code className="text-emerald-600 dark:text-emerald-400 font-mono">t</code>).{' '}
                  Converted to Cartesian automatically.
                </p>
                <KaTeXRenderer latex="r = f(\\theta), \\quad \\theta \\in [\\theta_{\\min},\\, \\theta_{\\max}]" displayMode={false} className="text-sm mt-1" />
              </motion.div>
            )}
            {mode === 'implicit' && (
              <motion.div key="i-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                <p className="text-[11px] font-semibold text-foreground">Implicit Curves</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Enter F(x, y) where the curve is F(x, y) = 0. Uses marching squares algorithm.{' '}
                  Works best for algebraic curves like circles, ellipses, and conics.
                </p>
                <KaTeXRenderer latex="F(x, y) = 0" displayMode={false} className="text-sm mt-1" />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}