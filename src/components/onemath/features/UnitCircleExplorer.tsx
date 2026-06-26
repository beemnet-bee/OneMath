'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import ResultCard from '@/components/onemath/ResultCard';
import KaTeXRenderer from '@/components/onemath/KaTeXRenderer';

// ─── Constants ───────────────────────────────────────────────────────
const CX = 150;
const CY = 150;
const R = 100; // SVG radius (1 unit = 100px)

const KEY_ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330] as const;
const SPECIAL_ANGLES_SET = new Set([0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]);
const QUICK_ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 270, 360] as const;

const TABLE_ANGLES = [0, 30, 45, 60, 90, 180, 270, 360] as const;

// ─── Helpers ─────────────────────────────────────────────────────────
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function fmt(n: number): string {
  if (!isFinite(n)) return n > 0 ? '+∞' : n < 0 ? '-∞' : 'undefined';
  return n.toFixed(6);
}

function getQuadrant(deg: number): { num: number; label: string } {
  const a = ((deg % 360) + 360) % 360;
  if (a === 0 || a === 360) return { num: 0, label: 'Positive x-axis' };
  if (a === 90) return { num: 0, label: 'Positive y-axis' };
  if (a === 180) return { num: 0, label: 'Negative x-axis' };
  if (a === 270) return { num: 0, label: 'Negative y-axis' };
  if (a < 90) return { num: 1, label: 'Quadrant I' };
  if (a < 180) return { num: 2, label: 'Quadrant II' };
  if (a < 270) return { num: 3, label: 'Quadrant III' };
  return { num: 4, label: 'Quadrant IV' };
}

function getReferenceAngle(deg: number): number {
  const a = ((deg % 360) + 360) % 360;
  if (a > 180) return 360 - a;
  if (a > 90) return 180 - a;
  return a;
}

function radianToLatex(deg: number): string {
  const a = ((deg % 360) + 360) % 360;
  // Common exact radian values
  const exactMap: Record<number, string> = {
    0: '0',
    30: '\\frac{\\pi}{6}',
    45: '\\frac{\\pi}{4}',
    60: '\\frac{\\pi}{3}',
    90: '\\frac{\\pi}{2}',
    120: '\\frac{2\\pi}{3}',
    135: '\\frac{3\\pi}{4}',
    150: '\\frac{5\\pi}{6}',
    180: '\\pi',
    210: '\\frac{7\\pi}{6}',
    225: '\\frac{5\\pi}{4}',
    240: '\\frac{4\\pi}{3}',
    270: '\\frac{3\\pi}{2}',
    300: '\\frac{5\\pi}{3}',
    315: '\\frac{7\\pi}{4}',
    330: '\\frac{11\\pi}{6}',
    360: '2\\pi',
  };
  if (exactMap[a] !== undefined) return exactMap[a];
  const rad = (a * Math.PI) / 180;
  return rad.toFixed(4) + '\\;\\text{rad}';
}

// ─── SVG coordinate conversion ───────────────────────────────────────
function toSvgX(mathX: number): number {
  return CX + mathX * R;
}

function toSvgY(mathY: number): number {
  return CY - mathY * R;
}

// ─── Arc path for angle visualization ────────────────────────────────
function describeArc(startAngle: number, endAngle: number, arcR: number): string {
  const startRad = toRad(startAngle);
  const endRad = toRad(endAngle);
  const x1 = CX + arcR * Math.cos(startRad);
  const y1 = CY - arcR * Math.sin(startRad);
  const x2 = CX + arcR * Math.cos(endRad);
  const y2 = CY - arcR * Math.sin(endRad);
  const sweep = (endAngle - startAngle + 360) % 360 <= 180 ? 1 : 0;
  const largeArc = (endAngle - startAngle + 360) % 360 > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${arcR} ${arcR} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

// ─── Label positioning offsets ───────────────────────────────────────
function getLabelOffset(deg: number): { dx: number; dy: number; anchor: string } {
  const a = ((deg % 360) + 360) % 360;
  const rad = toRad(a);
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  // Push labels outward based on angle
  let dx: number, dy: number, anchor: string;

  if (Math.abs(cosA) < 0.1 && sinA > 0) {
    // 90°
    dx = 0; dy = -14; anchor = 'middle';
  } else if (Math.abs(cosA) < 0.1 && sinA < 0) {
    // 270°
    dx = 0; dy = 18; anchor = 'middle';
  } else if (cosA > 0 && Math.abs(sinA) < 0.1) {
    // 0°
    dx = 12; dy = 4; anchor = 'start';
  } else if (cosA < 0 && Math.abs(sinA) < 0.1) {
    // 180°
    dx = -12; dy = 4; anchor = 'end';
  } else if (cosA > 0 && sinA > 0) {
    // Q1
    dx = 8; dy = -6; anchor = 'start';
  } else if (cosA < 0 && sinA > 0) {
    // Q2
    dx = -8; dy = -6; anchor = 'end';
  } else if (cosA < 0 && sinA < 0) {
    // Q3
    dx = -8; dy = 14; anchor = 'end';
  } else {
    // Q4
    dx = 8; dy = 14; anchor = 'start';
  }

  return { dx, dy, anchor };
}

// ─── Quadrant Colors ─────────────────────────────────────────────────
const QUADRANT_COLORS: Record<number, string> = {
  0: 'text-muted-foreground',
  1: 'text-emerald-600 dark:text-emerald-400',
  2: 'text-amber-600 dark:text-amber-400',
  3: 'text-rose-600 dark:text-rose-400',
  4: 'text-violet-600 dark:text-violet-400',
};

const QUADRANT_BG: Record<number, string> = {
  0: 'bg-muted/30',
  1: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40',
  2: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40',
  3: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40',
  4: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/40',
};

// ─── Main Component ──────────────────────────────────────────────────
export default function UnitCircleExplorer() {
  const [angle, setAngle] = useState<number>(30);
  const [isDragging, setIsDragging] = useState(false);

  const normalizedAngle = ((angle % 360) + 360) % 360;
  const rad = toRad(normalizedAngle);
  const cosVal = Math.cos(rad);
  const sinVal = Math.sin(rad);

  const tanVal = Math.abs(cosVal) < 1e-10 ? Infinity : Math.tan(rad);
  const cotVal = Math.abs(sinVal) < 1e-10 ? Infinity : cosVal / sinVal;
  const secVal = Math.abs(cosVal) < 1e-10 ? Infinity : 1 / cosVal;
  const cscVal = Math.abs(sinVal) < 1e-10 ? Infinity : 1 / sinVal;

  const quadrant = getQuadrant(normalizedAngle);
  const refAngle = getReferenceAngle(normalizedAngle);

  // SVG point coordinates
  const px = toSvgX(cosVal);
  const py = toSvgY(sinVal);

  // Projection endpoints
  const projX = toSvgX(cosVal);
  const projYOnAxis = CY; // y=0 in SVG is CY

  // Arc path
  const arcPath = normalizedAngle > 0.5 ? describeArc(0, normalizedAngle, 20) : '';

  // ─── Handlers ──────────────────────────────────────────────────────
  const updateAngleFromPointer = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 300 / rect.width;
    const scaleY = 300 / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;
    const dx = svgX - CX;
    const dy = -(svgY - CY); // flip Y
    let newAngle = toDeg(Math.atan2(dy, dx));
    if (newAngle < 0) newAngle += 360;
    setAngle(Math.round(newAngle * 10) / 10);
  }, []);

  const handleSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as SVGSVGElement).setPointerCapture(e.pointerId);
    updateAngleFromPointer(e);
  }, [updateAngleFromPointer]);

  const handleSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    updateAngleFromPointer(e);
  }, [isDragging, updateAngleFromPointer]);

  const handleSvgPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ─── Special angles table ──────────────────────────────────────────
  const tableData = useMemo(() => {
    return TABLE_ANGLES.map((a) => {
      const r = toRad(a);
      const s = Math.sin(r);
      const c = Math.cos(r);
      const t = Math.abs(c) < 1e-10 ? null : Math.tan(r);
      return { angle: a, sin: s, cos: c, tan: t };
    });
  }, []);

  // ─── KaTeX strings ─────────────────────────────────────────────────
  const angleLatex = `\\theta = ${normalizedAngle}° = ${radianToLatex(normalizedAngle)}`;
  const refAngleLatex = refAngle === 0
    ? '\\text{Reference angle: } 0°'
    : `\\text{Reference angle: } ${refAngle}° = ${radianToLatex(refAngle)}`;

  // ─── Trig values rows ──────────────────────────────────────────────
  const trigRows = [
    { label: 'sin(θ)', value: fmt(sinVal), highlight: true },
    { label: 'cos(θ)', value: fmt(cosVal), highlight: true },
    { label: 'tan(θ)', value: fmt(tanVal), highlight: false },
    { label: 'csc(θ)', value: fmt(cscVal), highlight: false },
    { label: 'sec(θ)', value: fmt(secVal), highlight: false },
    { label: 'cot(θ)', value: fmt(cotVal), highlight: false },
  ];

  return (
    <div className="space-y-4">
      <FeatureHeader
        icon="⊙"
        title="Unit Circle Explorer"
        description="Interactive trigonometry visualization"
        gradient="from-amber-500 to-orange-500"
      />

      {/* ─── Main Layout: SVG + Info Panel ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: SVG Unit Circle */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <Card className="border-emerald-200/30 dark:border-emerald-800/20 shadow-sm overflow-hidden">
            <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400" />
            <CardContent className="p-4 flex flex-col items-center">
              {/* SVG Circle */}
              <svg
                viewBox="0 0 300 300"
                className="w-full max-w-[320px] aspect-square cursor-crosshair select-none touch-none"
                onPointerDown={handleSvgPointerDown}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerUp}
                onPointerLeave={handleSvgPointerUp}
              >
                <defs>
                  {/* Glow filter for the active point */}
                  <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Arrow marker */}
                  <marker id="arrowHead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <path d="M 0 0 L 8 3 L 0 6 Z" fill="currentColor" className="text-muted-foreground/60" />
                  </marker>
                </defs>

                {/* Grid lines (subtle) */}
                {[-1, -0.5, 0.5, 1].map((v) => (
                  <g key={v}>
                    <line
                      x1={toSvgX(v)} y1={toSvgY(-1.1)} x2={toSvgX(v)} y2={toSvgY(1.1)}
                      stroke="currentColor" className="text-muted-foreground/8" strokeWidth="0.5"
                    />
                    <line
                      x1={toSvgX(-1.1)} y1={toSvgY(v)} x2={toSvgX(1.1)} y2={toSvgY(v)}
                      stroke="currentColor" className="text-muted-foreground/8" strokeWidth="0.5"
                    />
                  </g>
                ))}

                {/* X Axis */}
                <line
                  x1={toSvgX(-1.2)} y1={CY} x2={toSvgX(1.2)} y2={CY}
                  stroke="currentColor" className="text-muted-foreground/40" strokeWidth="1"
                  markerEnd="url(#arrowHead)"
                />
                {/* Y Axis */}
                <line
                  x1={CX} y1={toSvgY(1.2)} x2={CX} y2={toSvgY(-1.2)}
                  stroke="currentColor" className="text-muted-foreground/40" strokeWidth="1"
                  markerEnd="url(#arrowHead)"
                />

                {/* Axis labels */}
                <text x={toSvgX(1.15)} y={CY + 14} textAnchor="end" className="fill-muted-foreground/60" fontSize="9" style={{ fontFamily: "'Latin Modern Math', serif" }}>x</text>
                <text x={CX + 12} y={toSvgY(1.15) + 3} textAnchor="start" className="fill-muted-foreground/60" fontSize="9" style={{ fontFamily: "'Latin Modern Math', serif" }}>y</text>

                {/* Axis tick labels */}
                {[{ v: -1, label: '-1' }, { v: 1, label: '1' }].map(({ v, label }) => (
                  <g key={v}>
                    <text x={toSvgX(v)} y={CY + 14} textAnchor="middle" className="fill-muted-foreground/50" fontSize="8" style={{ fontFamily: "'Latin Modern Math', serif" }}>{label}</text>
                    <text x={CX - 10} y={toSvgY(v) + 3} textAnchor="end" className="fill-muted-foreground/50" fontSize="8" style={{ fontFamily: "'Latin Modern Math', serif" }}>{label}</text>
                  </g>
                ))}

                {/* Unit Circle */}
                <circle
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke="currentColor"
                  className="text-foreground/20"
                  strokeWidth="1.5"
                />

                {/* Angle arc */}
                {arcPath && (
                  <path
                    d={arcPath}
                    fill="none"
                    stroke="currentColor"
                    className="text-orange-400 dark:text-orange-500"
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                )}

                {/* Radius line from origin to point */}
                <line
                  x1={CX} y1={CY}
                  x2={px} y2={py}
                  stroke="currentColor"
                  className="text-foreground/50"
                  strokeWidth="1.5"
                />

                {/* cos projection (horizontal dashed) — amber */}
                <line
                  x1={CX} y1={CY}
                  x2={projX} y2={CY}
                  stroke="currentColor"
                  className="text-amber-500 dark:text-amber-400"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  opacity="0.8"
                />

                {/* sin projection (vertical dashed) — emerald */}
                <line
                  x1={projX} y1={CY}
                  x2={projX} y2={py}
                  stroke="currentColor"
                  className="text-emerald-500 dark:text-emerald-400"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  opacity="0.8"
                />

                {/* Projection labels */}
                {Math.abs(cosVal) > 0.08 && (
                  <text
                    x={(CX + projX) / 2}
                    y={CY + (sinVal >= 0 ? 14 : -6)}
                    textAnchor="middle"
                    className="fill-amber-600 dark:fill-amber-400"
                    fontSize="8.5"
                    fontWeight="bold"
                    style={{ fontFamily: "'Latin Modern Math', serif" }}
                  >
                    cos
                  </text>
                )}
                {Math.abs(sinVal) > 0.08 && (
                  <text
                    x={projX + (cosVal >= 0 ? 8 : -8)}
                    y={(CY + py) / 2 + 3}
                    textAnchor={cosVal >= 0 ? 'start' : 'end'}
                    className="fill-emerald-600 dark:fill-emerald-400"
                    fontSize="8.5"
                    fontWeight="bold"
                    style={{ fontFamily: "'Latin Modern Math', serif" }}
                  >
                    sin
                  </text>
                )}

                {/* 16 key angle points and labels */}
                {KEY_ANGLES.map((a) => {
                  const r2 = toRad(a);
                  const cx2 = Math.cos(r2);
                  const cy2 = Math.sin(r2);
                  const sx = toSvgX(cx2);
                  const sy = toSvgY(cy2);
                  const isSpecial = SPECIAL_ANGLES_SET.has(a);
                  const offset = getLabelOffset(a);
                  const isCurrentAngle = Math.abs(normalizedAngle - a) < 1.5;

                  return (
                    <g key={a}>
                      {/* Dot on circle */}
                      <circle
                        cx={sx} cy={sy}
                        r={isCurrentAngle ? 4 : isSpecial ? 2.5 : 1.8}
                        fill={isCurrentAngle ? 'transparent' : isSpecial ? 'currentColor' : 'currentColor'}
                        className={isCurrentAngle ? '' : isSpecial ? 'text-emerald-500 dark:text-emerald-400' : 'text-muted-foreground/40'}
                        stroke={isCurrentAngle ? 'currentColor' : 'none'}
                        strokeWidth={isCurrentAngle ? 1.5 : 0}
                        strokeOpacity={isCurrentAngle ? 0.5 : 0}
                      />
                      {/* Angle label */}
                      <text
                        x={sx + offset.dx}
                        y={sy + offset.dy}
                        textAnchor={offset.anchor}
                        className={`fill-current ${isSpecial ? 'text-foreground/70 font-medium' : 'text-muted-foreground/40'}`}
                        fontSize={isSpecial ? '8' : '7'}
                        style={{ fontFamily: "'Latin Modern Math', serif" }}
                      >
                        {a}°
                      </text>
                      {/* Coordinates for special angles */}
                      {isSpecial && Math.abs(normalizedAngle - a) >= 1.5 && (
                        <text
                          x={sx + offset.dx}
                          y={sy + offset.dy + (a >= 180 ? 10 : -8)}
                          textAnchor={offset.anchor}
                          className="fill-muted-foreground/30"
                          fontSize="6"
                          style={{ fontFamily: "'Latin Modern Math', serif" }}
                        >
                          ({cx2.toFixed(2)}, {cy2.toFixed(2)})
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Active point with glow */}
                <circle
                  cx={px} cy={py}
                  r={7}
                  fill="currentColor"
                  className="text-orange-500 dark:text-orange-400"
                  filter="url(#pointGlow)"
                  opacity="0.3"
                />
                <circle
                  cx={px} cy={py}
                  r={4.5}
                  fill="currentColor"
                  className="text-orange-500 dark:text-orange-400"
                  filter="url(#pointGlow)"
                />
                <circle
                  cx={px} cy={py}
                  r={2}
                  fill="white"
                  className="dark:fill-orange-50"
                />

                {/* Current coordinate label */}
                <g>
                  <rect
                    x={px + (cosVal >= 0 ? 8 : -72)}
                    y={py + (sinVal >= 0 ? -20 : 8)}
                    width={64}
                    height={18}
                    rx={4}
                    className="fill-background/90 dark:fill-card/90 stroke-border/40"
                    strokeWidth="0.5"
                  />
                  <text
                    x={px + (cosVal >= 0 ? 12 : -68)}
                    y={py + (sinVal >= 0 ? -7 : 21)}
                    className="fill-foreground/80 font-medium"
                    fontSize="8.5"
                    style={{ fontFamily: "'Latin Modern Math', serif" }}
                  >
                    ({cosVal.toFixed(3)}, {sinVal.toFixed(3)})
                  </text>
                </g>
              </svg>

              {/* ─── Slider ─────────────────────────────────────────── */}
              <div className="w-full max-w-[320px] mt-3 px-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Angle</span>
                  <span
                    className="text-xs font-bold text-foreground"
                    style={{ fontFamily: "'Latin Modern Math', serif" }}
                  >
                    {normalizedAngle}°
                  </span>
                </div>
                <Slider
                  value={[angle]}
                  onValueChange={([v]) => setAngle(v)}
                  min={0}
                  max={360}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-muted-foreground/50" style={{ fontFamily: "'Latin Modern Math', serif" }}>0°</span>
                  <span className="text-[9px] text-muted-foreground/50" style={{ fontFamily: "'Latin Modern Math', serif" }}>180°</span>
                  <span className="text-[9px] text-muted-foreground/50" style={{ fontFamily: "'Latin Modern Math', serif" }}>360°</span>
                </div>
              </div>

              {/* ─── Quick Angle Buttons ─────────────────────────────── */}
              <div className="w-full max-w-[320px] mt-3">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Quick Angles</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ANGLES.map((a) => (
                    <Button
                      key={a}
                      variant={Math.abs(normalizedAngle - a) < 1 ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-all ${
                        Math.abs(normalizedAngle - a) < 1
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600'
                          : 'hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-700'
                      }`}
                      style={{ fontFamily: "'Latin Modern Math', serif" }}
                      onClick={() => setAngle(a)}
                    >
                      {a}°
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Info Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Angle Display with KaTeX */}
          <Card className="border-emerald-200/30 dark:border-emerald-800/20 shadow-sm overflow-hidden">
            <div className="h-[2px] bg-gradient-to-r from-orange-400 via-amber-400 to-transparent" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400">
                  Angle
                </p>
              </div>
              <div
                className="text-center py-1"
                style={{ fontFamily: "'Latin Modern Math', serif" }}
              >
                <KaTeXRenderer latex={angleLatex} displayMode={true} className="text-base" />
              </div>

              {/* Quadrant indicator */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={quadrant.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`mt-3 px-3 py-2 rounded-lg border text-center ${QUADRANT_BG[quadrant.num]}`}
                >
                  <span className={`text-xs font-bold ${QUADRANT_COLORS[quadrant.num]}`}>
                    {quadrant.label}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Reference angle */}
              {refAngle > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mt-2 text-center"
                  style={{ fontFamily: "'Latin Modern Math', serif" }}
                >
                  <KaTeXRenderer latex={refAngleLatex} displayMode={false} className="text-sm text-muted-foreground" />
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Trigonometric Values */}
          <ResultCard title="Trigonometric Values" rows={trigRows} />

          {/* Special Angles Table */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.2 }}
          >
            <Card className="border-emerald-200/30 dark:border-emerald-800/20 shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-transparent" />
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                  <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
                    Special Angles
                  </p>
                </div>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-center" style={{ fontFamily: "'Latin Modern Math', serif" }}>
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-[10px] text-muted-foreground font-semibold py-2 px-1.5">θ</th>
                        <th className="text-[10px] text-muted-foreground font-semibold py-2 px-1.5">sin θ</th>
                        <th className="text-[10px] text-muted-foreground font-semibold py-2 px-1.5">cos θ</th>
                        <th className="text-[10px] text-muted-foreground font-semibold py-2 px-1.5">tan θ</th>
                      </tr>
                    </thead>
                    <tbody className="max-h-96 overflow-y-auto">
                      {tableData.map((row) => {
                        const isActive = Math.abs(normalizedAngle - row.angle) < 1.5;
                        return (
                          <tr
                            key={row.angle}
                            className={`border-b border-border/15 last:border-0 transition-colors ${
                              isActive
                                ? 'bg-amber-50 dark:bg-amber-950/20'
                                : 'hover:bg-muted/30'
                            }`}
                          >
                            <td className={`text-[11px] py-1.5 px-1.5 font-medium ${isActive ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-foreground'}`}>
                              {row.angle}°
                            </td>
                            <td className="text-[11px] py-1.5 px-1.5 text-foreground">{row.sin === 0 ? '0' : row.sin === 1 ? '1' : row.sin === -1 ? '-1' : row.sin.toFixed(4)}</td>
                            <td className="text-[11px] py-1.5 px-1.5 text-foreground">{row.cos === 0 ? '0' : row.cos === 1 ? '1' : row.cos === -1 ? '-1' : row.cos.toFixed(4)}</td>
                            <td className="text-[11px] py-1.5 px-1.5 text-foreground">{row.tan === null ? '—' : row.tan === 0 ? '0' : row.tan === 1 ? '1' : row.tan === -1 ? '-1' : row.tan.toFixed(4)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}