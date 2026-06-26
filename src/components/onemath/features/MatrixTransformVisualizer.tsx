'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import ResultCard from '@/components/onemath/ResultCard';
import KaTeXRenderer from '@/components/onemath/KaTeXRenderer';
import { Play, RotateCcw, Grid3X3, Sparkles } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
type Matrix2x2 = [[number, number], [number, number]];

interface Preset {
  label: string;
  matrix: Matrix2x2;
}

// ─── Constants ───────────────────────────────────────────────────────
const SCALE = 100; // 100 SVG units = 1 math unit
const VIEWBOX = '-350 -350 700 700';
const GRID_MIN = -3;
const GRID_MAX = 3;

const IDENTITY: Matrix2x2 = [[1, 0], [0, 1]];

const PRESETS: Preset[] = [
  { label: 'Identity', matrix: [[1, 0], [0, 1]] },
  { label: 'Rotate 45°', matrix: [[Math.SQRT1_2, -Math.SQRT1_2], [Math.SQRT1_2, Math.SQRT1_2]] },
  { label: 'Rotate 90°', matrix: [[0, -1], [1, 0]] },
  { label: 'Shear X', matrix: [[1, 1], [0, 1]] },
  { label: 'Shear Y', matrix: [[1, 0], [1, 1]] },
  { label: 'Scale 2×', matrix: [[2, 0], [0, 2]] },
  { label: 'Reflect X', matrix: [[1, 0], [0, -1]] },
  { label: 'Reflect Y', matrix: [[-1, 0], [0, 1]] },
  { label: 'Squeeze', matrix: [[2, 0], [0, 0.5]] },
];

// ─── Math Helpers ────────────────────────────────────────────────────
function toSvg(x: number, y: number): [number, number] {
  return [x * SCALE, -y * SCALE];
}

function applyMatrix(m: Matrix2x2, x: number, y: number): [number, number] {
  return [m[0][0] * x + m[0][1] * y, m[1][0] * x + m[1][1] * y];
}

function det(m: Matrix2x2): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

function trace(m: Matrix2x2): number {
  return m[0][0] + m[1][1];
}

function eigenvalues(m: Matrix2x2): [string, string] {
  const t = trace(m);
  const d = det(m);
  const disc = t * t - 4 * d;
  if (disc >= 0) {
    const sqrtDisc = Math.sqrt(disc);
    const l1 = (t + sqrtDisc) / 2;
    const l2 = (t - sqrtDisc) / 2;
    return [l1.toFixed(4), l2.toFixed(4)];
  } else {
    const real = t / 2;
    const imag = Math.sqrt(-disc) / 2;
    return [
      `${real.toFixed(4)} + ${imag.toFixed(4)}i`,
      `${real.toFixed(4)} - ${imag.toFixed(4)}i`,
    ];
  }
}

function classifyTransform(m: Matrix2x2): string {
  const a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1];
  const dVal = det(m);
  const eps = 0.01;

  // Check identity
  if (Math.abs(a - 1) < eps && Math.abs(b) < eps && Math.abs(c) < eps && Math.abs(d - 1) < eps) {
    return 'Identity';
  }

  // Check reflection across x-axis
  if (Math.abs(a - 1) < eps && Math.abs(b) < eps && Math.abs(c) < eps && Math.abs(d + 1) < eps) {
    return 'Reflection (X)';
  }

  // Check reflection across y-axis
  if (Math.abs(a + 1) < eps && Math.abs(b) < eps && Math.abs(c) < eps && Math.abs(d - 1) < eps) {
    return 'Reflection (Y)';
  }

  // Check rotation (a=d, b=-c, a²+b²=1, det=1)
  if (Math.abs(a - d) < eps && Math.abs(b + c) < eps && Math.abs(a * a + b * b - 1) < 0.05 && Math.abs(dVal - 1) < 0.05) {
    const angle = Math.atan2(b, a) * (180 / Math.PI);
    if (Math.abs(angle) < eps) return 'Identity';
    return `Rotation (${angle > 0 ? angle.toFixed(1) : (360 + angle).toFixed(1)}°)`;
  }

  // Check reflection (det ≈ -1, a²+b² ≈ 1)
  if (Math.abs(dVal + 1) < 0.05 && Math.abs(a * a + b * b - 1) < 0.05) {
    return 'Reflection';
  }

  // Check pure scale (b=0, c=0)
  if (Math.abs(b) < eps && Math.abs(c) < eps) {
    if (Math.abs(a - d) < eps) {
      if (Math.abs(a * d - 1) < 0.05) return 'Uniform Scale';
      return 'Anisotropic Scale';
    }
    return 'Scale';
  }

  // Check shear (det ≈ 1, not rotation/scale)
  if (Math.abs(dVal - 1) < 0.05) {
    if (Math.abs(a - 1) < eps && Math.abs(d - 1) < eps) {
      if (Math.abs(b) > eps && Math.abs(c) < eps) return 'Shear (X)';
      if (Math.abs(c) > eps && Math.abs(b) < eps) return 'Shear (Y)';
      return 'Shear';
    }
    return 'Area-Preserving';
  }

  if (dVal < 0) return 'Orientation-Reversing';

  return 'General Linear';
}

function lerpMatrix(a: Matrix2x2, b: Matrix2x2, t: number): Matrix2x2 {
  return [
    [a[0][0] + (b[0][0] - a[0][0]) * t, a[0][1] + (b[0][1] - a[0][1]) * t],
    [a[1][0] + (b[1][0] - a[1][0]) * t, a[1][1] + (b[1][1] - a[1][1]) * t],
  ];
}

function formatNum(n: number): string {
  return n.toFixed(4);
}

// ─── SVG Sub-Components ─────────────────────────────────────────────
function ArrowHead({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <marker
        id={id}
        markerWidth="8"
        markerHeight="6"
        refX="7"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L8,3 L0,6 Z" fill={color} />
      </marker>
    </defs>
  );
}

function AxisArrow({ x1, y1, x2, y2, markerId, label, labelOffset }: {
  x1: number; y1: number; x2: number; y2: number;
  markerId: string; label: string;
  labelOffset: [number, number];
}) {
  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="currentColor"
        strokeWidth="1.5"
        markerEnd={`url(#${markerId})`}
        className="text-foreground/70"
      />
      <text
        x={x2 + labelOffset[0]}
        y={y2 + labelOffset[1]}
        className="fill-foreground/70 text-xs font-bold select-none"
        style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function MatrixTransformVisualizer() {
  const [matrix, setMatrix] = useState<Matrix2x2>([[1, 0], [0, 1]]);
  const [customAngle, setCustomAngle] = useState(45);
  const [showGridPoints, setShowGridPoints] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<number | null>(null);
  const animStartRef = useRef<number>(0);
  const fromMatrixRef = useRef<Matrix2x2>(IDENTITY);

  // ─── Derived Values ──────────────────────────────────────────────
  const detValue = useMemo(() => det(matrix), [matrix]);
  const traceValue = useMemo(() => trace(matrix), [matrix]);
  const [eig1, eig2] = useMemo(() => eigenvalues(matrix), [matrix]);
  const transformType = useMemo(() => classifyTransform(matrix), [matrix]);

  const areaInfo = useMemo(() => {
    const absDet = Math.abs(detValue);
    if (Math.abs(absDet - 1) < 0.01) return 'Preserves area';
    if (absDet > 1) return `Expands area (${formatNum(absDet)}×)`;
    return `Shrinks area (${formatNum(absDet)}×)`;
  }, [detValue]);

  const invertibleInfo = useMemo(() => {
    if (Math.abs(detValue) < 1e-10) return 'No (Singular)';
    return 'Yes (Non-singular)';
  }, [detValue]);

  // ─── KaTeX Strings ───────────────────────────────────────────────
  const detLatex = useMemo(() => {
    const a = formatNum(matrix[0][0]);
    const b = formatNum(matrix[0][1]);
    const c = formatNum(matrix[1][0]);
    const d = formatNum(matrix[1][1]);
    return `\\det(A) = (${a})(${d}) - (${b})(${c}) = ${formatNum(detValue)}`;
  }, [matrix, detValue]);

  const matrixLatex = useMemo(() => {
    const a = formatNum(matrix[0][0]);
    const b = formatNum(matrix[0][1]);
    const c = formatNum(matrix[1][0]);
    const d = formatNum(matrix[1][1]);
    return `\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}`;
  }, [matrix]);

  // ─── Handlers ────────────────────────────────────────────────────
  const updateCell = useCallback((row: 0 | 1, col: 0 | 1, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num)) {
      setMatrix(prev => {
        const next: Matrix2x2 = [[prev[0][0], prev[0][1]], [prev[1][0], prev[1][1]]];
        next[row][col] = num;
        return next;
      });
    }
  }, []);

  const applyPreset = useCallback((m: Matrix2x2) => {
    if (isAnimating) return;
    setMatrix(m);
  }, [isAnimating]);

  const applyRotation = useCallback(() => {
    if (isAnimating) return;
    const rad = (customAngle * Math.PI) / 180;
    setMatrix([[Math.cos(rad), -Math.sin(rad)], [Math.sin(rad), Math.cos(rad)]]);
  }, [customAngle, isAnimating]);

  const resetMatrix = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsAnimating(false);
    setMatrix(IDENTITY);
  }, []);

  const animateToMatrix = useCallback(() => {
    if (isAnimating) return;
    fromMatrixRef.current = [[matrix[0][0], matrix[0][1]], [matrix[1][0], matrix[1][1]]];
    setIsAnimating(true);
    animStartRef.current = performance.now();

    const duration = 1000;
    const target: Matrix2x2 = [[matrix[0][0], matrix[0][1]], [matrix[1][0], matrix[1][1]]];
    const from = fromMatrixRef.current;

    const tick = (now: number) => {
      const elapsed = now - animStartRef.current;
      const t = Math.min(elapsed / duration, 1);
      // Ease in-out cubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const interpolated = lerpMatrix(from, target, ease);
      setMatrix(interpolated);

      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setIsAnimating(false);
        setMatrix(target);
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, [matrix, isAnimating]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ─── SVG Geometry Computation ────────────────────────────────────
  const unitSquareCorners = useMemo(() => {
    return [[0, 0], [1, 0], [1, 1], [0, 1]] as const;
  }, []);

  const transformedCorners = useMemo(() => {
    return unitSquareCorners.map(([x, y]) => applyMatrix(matrix, x, y));
  }, [matrix, unitSquareCorners]);

  const transformedBasisE1 = useMemo(() => applyMatrix(matrix, 1, 0), [matrix]);
  const transformedBasisE2 = useMemo(() => applyMatrix(matrix, 0, 1), [matrix]);

  const gridPoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = GRID_MIN; i <= GRID_MAX; i++) {
      for (let j = GRID_MIN; j <= GRID_MAX; j++) {
        pts.push([i, j]);
      }
    }
    return pts;
  }, []);

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <FeatureHeader
        icon="⊗"
        title="Matrix Transforms"
        description="Visualize 2D linear transformations"
        gradient="from-teal-500 to-cyan-500"
      />

      {/* ── SVG Canvas ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <Card className="border-teal-200/30 dark:border-teal-800/20 shadow-sm overflow-hidden">
          <div className="h-[2px] bg-gradient-to-r from-teal-400 via-cyan-300 to-transparent dark:from-teal-500 dark:via-cyan-500 dark:to-transparent" />
          <CardContent className="p-4">
            <div className="flex justify-center">
              <svg
                viewBox={VIEWBOX}
                className="w-full max-w-[400px] aspect-square rounded-lg bg-white dark:bg-zinc-950 border border-border/40 select-none"
                style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
              >
                {/* ── Defs ─────────────────────────────────────────── */}
                <ArrowHead id="axis-arrow" color="rgb(100,116,139)" />
                <ArrowHead id="e1-arrow" color="#10b981" />
                <ArrowHead id="e2-arrow" color="#f97316" />
                <ArrowHead id="e1t-arrow" color="#10b981" />
                <ArrowHead id="e2t-arrow" color="#f97316" />

                {/* ── Grid Lines ───────────────────────────────────── */}
                {Array.from({ length: GRID_MAX - GRID_MIN + 1 }, (_, i) => {
                  const v = GRID_MIN + i;
                  const svgV = v * SCALE;
                  return (
                    <g key={`grid-${v}`}>
                      {/* Vertical grid line */}
                      <line
                        x1={svgV} y1={GRID_MIN * SCALE} x2={svgV} y2={GRID_MAX * SCALE}
                        stroke="currentColor"
                        strokeWidth={v === 0 ? 0 : 0.5}
                        strokeDasharray={v === 0 ? 'none' : '4,4'}
                        className={v === 0 ? 'text-foreground/10' : 'text-foreground/8'}
                      />
                      {/* Horizontal grid line */}
                      <line
                        x1={GRID_MIN * SCALE} y1={-svgV} x2={GRID_MAX * SCALE} y2={-svgV}
                        stroke="currentColor"
                        strokeWidth={v === 0 ? 0 : 0.5}
                        strokeDasharray={v === 0 ? 'none' : '4,4'}
                        className={v === 0 ? 'text-foreground/10' : 'text-foreground/8'}
                      />
                    </g>
                  );
                })}

                {/* ── Axes ─────────────────────────────────────────── */}
                <AxisArrow
                  x1={GRID_MIN * SCALE} y1={0}
                  x2={(GRID_MAX + 0.5) * SCALE} y2={0}
                  markerId="axis-arrow" label="x" labelOffset={[12, 0]}
                />
                <AxisArrow
                  x1={0} y1={-GRID_MIN * SCALE}
                  x2={0} y2={-(GRID_MAX + 0.5) * SCALE}
                  markerId="axis-arrow" label="y" labelOffset={[0, -12]}
                />

                {/* ── Tick Labels ──────────────────────────────────── */}
                {Array.from({ length: GRID_MAX - GRID_MIN + 1 }, (_, i) => {
                  const v = GRID_MIN + i;
                  if (v === 0) return null;
                  const svgX = v * SCALE;
                  return (
                    <g key={`tick-${v}`}>
                      {/* X-axis ticks */}
                      <line
                        x1={svgX} y1={-4} x2={svgX} y2={4}
                        stroke="currentColor" strokeWidth="1"
                        className="text-foreground/40"
                      />
                      <text
                        x={svgX} y={16}
                        textAnchor="middle"
                        className="fill-foreground/40 text-[10px] select-none"
                      >
                        {v}
                      </text>
                      {/* Y-axis ticks */}
                      <line
                        x1={-4} y1={-svgX} x2={4} y2={-svgX}
                        stroke="currentColor" strokeWidth="1"
                        className="text-foreground/40"
                      />
                      <text
                        x={-12} y={-svgX}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-foreground/40 text-[10px] select-none"
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}

                {/* ── Optional Grid Points ─────────────────────────── */}
                <AnimatePresence>
                  {showGridPoints && (
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {gridPoints.map(([gx, gy]) => {
                        const [tx, ty] = applyMatrix(matrix, gx, gy);
                        return (
                          <circle
                            key={`gp-${gx}-${gy}`}
                            cx={tx * SCALE}
                            cy={-ty * SCALE}
                            r="2.5"
                            className="fill-cyan-400/50 dark:fill-cyan-500/50"
                          />
                        );
                      })}
                    </motion.g>
                  )}
                </AnimatePresence>

                {/* ── Original Unit Square ─────────────────────────── */}
                <polygon
                  points={unitSquareCorners.map(([x, y]) => {
                    const [sx, sy] = toSvg(x, y);
                    return `${sx},${sy}`;
                  }).join(' ')}
                  fill="rgba(20, 184, 166, 0.08)"
                  stroke="rgba(20, 184, 166, 0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="5,3"
                />

                {/* ── Transformed Unit Square ──────────────────────── */}
                <polygon
                  points={transformedCorners.map(([x, y]) => {
                    const [sx, sy] = toSvg(x, y);
                    return `${sx},${sy}`;
                  }).join(' ')}
                  fill="rgba(20, 184, 166, 0.18)"
                  stroke="rgba(20, 184, 166, 0.7)"
                  strokeWidth="2"
                />

                {/* ── Original Basis Vectors (gray, dashed) ────────── */}
                <line
                  x1="0" y1="0" x2={SCALE} y2="0"
                  stroke="rgba(100,116,139,0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />
                <line
                  x1="0" y1="0" x2="0" y2={-SCALE}
                  stroke="rgba(100,116,139,0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />

                {/* ── Transformed Basis Vectors ─────────────────────── */}
                {/* e1' (emerald) */}
                <line
                  x1="0" y1="0"
                  x2={transformedBasisE1[0] * SCALE}
                  y2={-transformedBasisE1[1] * SCALE}
                  stroke="#10b981"
                  strokeWidth="2.5"
                  markerEnd="url(#e1t-arrow)"
                />
                {/* e2' (orange) */}
                <line
                  x1="0" y1="0"
                  x2={transformedBasisE2[0] * SCALE}
                  y2={-transformedBasisE2[1] * SCALE}
                  stroke="#f97316"
                  strokeWidth="2.5"
                  markerEnd="url(#e2t-arrow)"
                />

                {/* ── Basis Vector Labels ──────────────────────────── */}
                <text
                  x={transformedBasisE1[0] * SCALE * 1.08 + 8}
                  y={-transformedBasisE1[1] * SCALE * 1.08 - 8}
                  className="fill-emerald-500 text-sm font-bold select-none"
                  style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                >
                  e₁&apos;
                </text>
                <text
                  x={transformedBasisE2[0] * SCALE * 1.08 + 8}
                  y={-transformedBasisE2[1] * SCALE * 1.08 - 8}
                  className="fill-orange-500 text-sm font-bold select-none"
                  style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                >
                  e₂&apos;
                </text>

                {/* ── Origin dot ───────────────────────────────────── */}
                <circle cx="0" cy="0" r="3" className="fill-foreground/60" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Matrix Input + Controls (responsive: side-by-side on desktop, stacked on mobile) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matrix Input */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-teal-200/30 dark:border-teal-800/20 shadow-sm overflow-hidden">
            <div className="h-[2px] bg-gradient-to-r from-teal-400 via-cyan-300 to-transparent dark:from-teal-500 dark:via-cyan-500 dark:to-transparent" />
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-sm shadow-teal-500/40" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-teal-600 dark:text-teal-400">
                  Matrix A
                </p>
              </div>

              {/* 2x2 Matrix Layout */}
              <div className="flex items-center justify-center gap-1">
                {/* Left bracket */}
                <div className="text-3xl text-foreground/30 font-light leading-none select-none" style={{ fontFamily: "'Latin Modern Math', serif" }}>
                  [
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={matrix[0][0]}
                    onChange={e => updateCell(0, 0, e.target.value)}
                    className="w-20 h-9 text-center text-sm font-mono number-math bg-background/50"
                    style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={matrix[0][1]}
                    onChange={e => updateCell(0, 1, e.target.value)}
                    className="w-20 h-9 text-center text-sm font-mono number-math bg-background/50"
                    style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={matrix[1][0]}
                    onChange={e => updateCell(1, 0, e.target.value)}
                    className="w-20 h-9 text-center text-sm font-mono number-math bg-background/50"
                    style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={matrix[1][1]}
                    onChange={e => updateCell(1, 1, e.target.value)}
                    className="w-20 h-9 text-center text-sm font-mono number-math bg-background/50"
                    style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                  />
                </div>
                {/* Right bracket */}
                <div className="text-3xl text-foreground/30 font-light leading-none select-none" style={{ fontFamily: "'Latin Modern Math', serif" }}>
                  ]
                </div>
              </div>

              {/* Matrix KaTeX display */}
              <div className="flex justify-center">
                <KaTeXRenderer latex={matrixLatex} displayMode={false} className="text-base" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={animateToMatrix}
                  disabled={isAnimating}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Animate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetMatrix}
                  className="flex-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Presets + Rotation Slider */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-teal-200/30 dark:border-teal-800/20 shadow-sm overflow-hidden h-full">
            <div className="h-[2px] bg-gradient-to-r from-teal-400 via-cyan-300 to-transparent dark:from-teal-500 dark:via-cyan-500 dark:to-transparent" />
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-sm shadow-teal-500/40" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-teal-600 dark:text-teal-400">
                  Presets
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2.5 font-medium"
                    onClick={() => applyPreset(p.matrix)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>

              {/* Rotation Slider */}
              <div className="space-y-2 pt-1 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground font-medium">Custom Rotation</Label>
                  <span
                    className="text-xs text-foreground font-medium number-math"
                    style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                  >
                    {customAngle}°
                  </span>
                </div>
                <Slider
                  value={[customAngle]}
                  onValueChange={([v]) => setCustomAngle(v)}
                  min={0}
                  max={360}
                  step={1}
                  className="w-full"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={applyRotation}
                >
                  <Sparkles className="w-3 h-3 mr-1.5 text-teal-500" />
                  Apply Rotation
                </Button>
              </div>

              {/* Grid Points Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-border/30">
                <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Grid3X3 className="w-3.5 h-3.5" />
                  Show Grid Points
                </Label>
                <Switch
                  checked={showGridPoints}
                  onCheckedChange={setShowGridPoints}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Info Panel ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultCard
          title="Properties"
          KaTeXRenderer={KaTeXRenderer}
          latex={[detLatex]}
          rows={[
            { label: 'Determinant', value: formatNum(detValue), highlight: true },
            { label: 'Trace', value: formatNum(traceValue) },
            { label: 'Area Effect', value: areaInfo },
            { label: 'Invertible', value: invertibleInfo },
            { label: 'Type', value: transformType },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-teal-200/30 dark:border-teal-800/20 shadow-sm overflow-hidden h-full">
            <div className="h-[2px] bg-gradient-to-r from-teal-400 via-cyan-300 to-transparent dark:from-teal-500 dark:via-cyan-500 dark:to-transparent" />
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-sm shadow-teal-500/40" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-teal-600 dark:text-teal-400">
                  Eigenvalues
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-medium w-6 shrink-0">λ₁</span>
                  <div className="h-px flex-1 bg-border/30" />
                  <span
                    className="text-sm text-foreground font-medium number-math text-right"
                    style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                  >
                    {eig1}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-medium w-6 shrink-0">λ₂</span>
                  <div className="h-px flex-1 bg-border/30" />
                  <span
                    className="text-sm text-foreground font-medium number-math text-right"
                    style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                  >
                    {eig2}
                  </span>
                </div>
              </div>

              {/* Eigenvalue Formula */}
              <div className="pt-2 border-t border-border/30">
                <KaTeXRenderer
                  latex={`\\lambda = \\frac{\\mathrm{tr}(A) \\pm \\sqrt{\\mathrm{tr}(A)^2 - 4\\det(A)}}{2} = \\frac{${formatNum(traceValue)} \\pm \\sqrt{${formatNum(traceValue * traceValue - 4 * detValue)}}}{2}`}
                  displayMode={false}
                  className="text-xs text-muted-foreground"
                />
              </div>

              {/* Legend */}
              <div className="pt-2 border-t border-border/30 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-0.5 bg-emerald-500 rounded-full" />
                  <span className="text-[11px] text-muted-foreground">
                    e₁&apos; = ({formatNum(transformedBasisE1[0])}, {formatNum(transformedBasisE1[1])})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-0.5 bg-orange-500 rounded-full" />
                  <span className="text-[11px] text-muted-foreground">
                    e₂&apos; = ({formatNum(transformedBasisE2[0])}, {formatNum(transformedBasisE2[1])})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border-2 border-dashed border-teal-500/35 bg-teal-500/8" />
                  <span className="text-[11px] text-muted-foreground">Original unit square</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border-2 border-teal-500/70 bg-teal-500/18" />
                  <span className="text-[11px] text-muted-foreground">Transformed unit square</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}