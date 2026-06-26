'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluate } from 'mathjs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Maximize2, Crosshair, Trash2, Zap } from 'lucide-react';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import ResultCard from '@/components/onemath/ResultCard';
import KaTeXRenderer from '@/components/onemath/KaTeXRenderer';

// ─── Types ────────────────────────────────────────────────────────────
interface FunctionSlot {
  id: number;
  expr: string;
  enabled: boolean;
  color: string;
  colorClass: string;
  label: string;
  error: string;
}

interface IntersectionPoint {
  x: number;
  y: number;
  f1Label: string;
  f2Label: string;
}

// ─── Constants ────────────────────────────────────────────────────────
const FUNCTION_COLORS = [
  { color: '#10b981', colorClass: 'bg-emerald-500', strokeClass: 'stroke-emerald-500', textClass: 'text-emerald-500', label: 'f₁' },
  { color: '#f59e0b', colorClass: 'bg-amber-500', strokeClass: 'stroke-amber-500', textClass: 'text-amber-500', label: 'f₂' },
  { color: '#f43f5e', colorClass: 'bg-rose-500', strokeClass: 'stroke-rose-500', textClass: 'text-rose-500', label: 'f₃' },
  { color: '#06b6d4', colorClass: 'bg-cyan-500', strokeClass: 'stroke-cyan-500', textClass: 'text-cyan-500', label: 'f₄' },
] as const;

const NUM_SAMPLE_POINTS = 800;
const INTERSECTION_STEP = 0.01;
const BISECTION_TOLERANCE = 1e-9;
const BISECTION_MAX_ITER = 60;

const KEY_X_POSITIONS = [-3, -2, -1, 0, 1, 2, 3];

// ─── Presets ──────────────────────────────────────────────────────────
interface Preset {
  label: string;
  functions: Array<{ expr: string; enabled: boolean }>;
  latex: string[];
  xMin?: number;
  xMax?: number;
}

const PRESETS: Preset[] = [
  {
    label: 'Linear vs Quadratic',
    functions: [
      { expr: 'x', enabled: true },
      { expr: 'x^2', enabled: true },
      { expr: '', enabled: false },
      { expr: '', enabled: false },
    ],
    latex: ['f_1(x) = x', 'f_2(x) = x^2'],
  },
  {
    label: 'Trig Functions',
    functions: [
      { expr: 'sin(x)', enabled: true },
      { expr: 'cos(x)', enabled: true },
      { expr: 'tan(x)', enabled: true },
      { expr: '', enabled: false },
    ],
    latex: ['f_1(x) = \\sin x', 'f_2(x) = \\cos x', 'f_3(x) = \\tan x'],
    xMin: -7,
    xMax: 7,
  },
  {
    label: 'Exponential Growth',
    functions: [
      { expr: '2^x', enabled: true },
      { expr: 'e^x', enabled: true },
      { expr: '10^x', enabled: true },
      { expr: '', enabled: false },
    ],
    latex: ['f_1(x) = 2^x', 'f_2(x) = e^x', 'f_3(x) = 10^x'],
    xMin: -3,
    xMax: 3,
  },
  {
    label: 'Inverse Functions',
    functions: [
      { expr: 'x^2', enabled: true },
      { expr: 'sqrt(x)', enabled: true },
      { expr: '', enabled: false },
      { expr: '', enabled: false },
    ],
    latex: ['f_1(x) = x^2', 'f_2(x) = \\sqrt{x}'],
    xMin: -2,
    xMax: 6,
  },
  {
    label: 'Sine Waveforms',
    functions: [
      { expr: 'sin(x)', enabled: true },
      { expr: 'sin(2*x)', enabled: true },
      { expr: 'sin(3*x)', enabled: true },
      { expr: '', enabled: false },
    ],
    latex: ['f_1(x) = \\sin x', 'f_2(x) = \\sin 2x', 'f_3(x) = \\sin 3x'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────

/** Preprocess expression: replace ^ with ** for mathjs, handle ln, etc. */
function preprocessExpr(expr: string): string {
  let processed = expr.trim();
  // mathjs handles ^ natively as power, so no replacement needed
  // but we do want to ensure 'ln' maps to 'log' (natural log)
  processed = processed.replace(/\bln\b/g, 'log');
  return processed;
}

/** Safely evaluate a math expression at a given x value */
function safeEval(expr: string, x: number): number {
  try {
    const scope: Record<string, number> = {
      x,
      e: Math.E,
      pi: Math.PI,
      PI: Math.PI,
    };
    const processed = preprocessExpr(expr);
    const result = evaluate(processed, scope);
    return typeof result === 'number' && isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}

/** Check if expression is syntactically valid */
function validateExpr(expr: string): string {
  if (!expr.trim()) return '';
  try {
    const processed = preprocessExpr(expr);
    const scope: Record<string, number> = { x: 1, e: Math.E, pi: Math.PI };
    const result = evaluate(processed, scope);
    if (typeof result !== 'number') return 'Expression does not return a number';
    return '';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid expression';
    // Shorten error messages
    if (msg.length > 60) return msg.slice(0, 60) + '...';
    return msg;
  }
}

/** Generate SVG path data for a function over [xMin, xMax] */
function generateFunctionPath(
  expr: string,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  svgW: number,
  svgH: number
): string {
  const points: Array<{ x: number; y: number }> = [];
  const dx = (xMax - xMin) / NUM_SAMPLE_POINTS;

  for (let i = 0; i <= NUM_SAMPLE_POINTS; i++) {
    const xVal = xMin + i * dx;
    const yVal = safeEval(expr, xVal);

    if (!isNaN(yVal) && Math.abs(yVal) < 1e8) {
      // Convert to SVG coordinates
      const svgX = ((xVal - xMin) / (xMax - xMin)) * svgW;
      const svgY = svgH - ((yVal - yMin) / (yMax - yMin)) * svgH;
      // Clamp y to prevent overflow
      const clampedY = Math.max(-100, Math.min(svgH + 100, svgY));
      points.push({ x: svgX, y: clampedY });
    } else {
      points.push({ x: NaN, y: NaN });
    }
  }

  return buildSVGPath(points);
}

/** Build SVG path string, breaking at NaN gaps */
function buildSVGPath(points: Array<{ x: number; y: number }>): string {
  let d = '';
  let penDown = false;

  for (const pt of points) {
    if (isNaN(pt.x) || isNaN(pt.y)) {
      penDown = false;
      continue;
    }
    if (!penDown) {
      d += `M${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
      penDown = true;
    } else {
      d += `L${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
    }
  }
  return d;
}

/** Find intersections between two functions using bisection */
function findIntersectionsBetween(
  expr1: string,
  expr2: string,
  xMin: number,
  xMax: number,
  label1: string,
  label2: string
): IntersectionPoint[] {
  const intersections: IntersectionPoint[] = [];
  let prevDiff = NaN;
  let prevX = xMin;

  for (let x = xMin; x <= xMax; x += INTERSECTION_STEP) {
    const y1 = safeEval(expr1, x);
    const y2 = safeEval(expr2, x);

    if (isNaN(y1) || isNaN(y2) || Math.abs(y1) > 1e6 || Math.abs(y2) > 1e6) {
      prevDiff = NaN;
      prevX = x;
      continue;
    }

    const diff = y1 - y2;

    if (!isNaN(prevDiff) && prevDiff * diff < 0) {
      // Sign change detected — bisect
      let lo = prevX;
      let hi = x;

      for (let iter = 0; iter < BISECTION_MAX_ITER; iter++) {
        const mid = (lo + hi) / 2;
        const midY1 = safeEval(expr1, mid);
        const midY2 = safeEval(expr2, mid);

        if (isNaN(midY1) || isNaN(midY2)) break;

        const midDiff = midY1 - midY2;

        if (Math.abs(midDiff) < BISECTION_TOLERANCE || (hi - lo) < BISECTION_TOLERANCE) {
          const fy = safeEval(expr1, mid);
          if (!isNaN(fy) && Math.abs(fy) < 1e6) {
            // Check this isn't a duplicate (within 0.05 of an existing point)
            const isDuplicate = intersections.some(
              (pt) => Math.abs(pt.x - mid) < 0.05
            );
            if (!isDuplicate) {
              intersections.push({ x: mid, y: fy, f1Label: label1, f2Label: label2 });
            }
          }
          break;
        }

        const loDiff = safeEval(expr1, lo) - safeEval(expr2, lo);
        if (isNaN(loDiff)) break;

        if (loDiff * midDiff < 0) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
    }

    // Also check for exact zero crossing (diff very close to 0)
    if (!isNaN(prevDiff) && Math.abs(diff) < 1e-8) {
      const fy = safeEval(expr1, x);
      if (!isNaN(fy) && Math.abs(fy) < 1e6) {
        const isDuplicate = intersections.some(
          (pt) => Math.abs(pt.x - x) < 0.05
        );
        if (!isDuplicate) {
          intersections.push({ x, y: fy, f1Label: label1, f2Label: label2 });
        }
      }
    }

    prevDiff = diff;
    prevX = x;
  }

  return intersections;
}

/** Convert expression to simple LaTeX */
function exprToLatex(expr: string): string {
  let latex = expr
    .replace(/\*/g, ' \\cdot ')
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/\bsin\b/g, '\\sin')
    .replace(/\bcos\b/g, '\\cos')
    .replace(/\btan\b/g, '\\tan')
    .replace(/\blog\b/g, '\\log')
    .replace(/\bexp\b/g, '\\exp')
    .replace(/\babs\b/g, '|')
    .replace(/\bpi\b/g, '\\pi')
    .replace(/\be\b(?!\^)/g, 'e');
  return latex;
}

// ─── Default slots ────────────────────────────────────────────────────
function createDefaultSlots(): FunctionSlot[] {
  return FUNCTION_COLORS.map((fc, i) => ({
    id: i,
    expr: '',
    enabled: i === 0,
    color: fc.color,
    colorClass: fc.colorClass,
    label: fc.label,
    error: '',
  }));
}

// ─── Component ────────────────────────────────────────────────────────
export default function FunctionComparison() {
  const [slots, setSlots] = useState<FunctionSlot[]>(createDefaultSlots);
  const [xMin, setXMin] = useState(-5);
  const [xMax, setXMax] = useState(5);
  const [showIntersections, setShowIntersections] = useState(true);
  const [presetLatex, setPresetLatex] = useState<string[]>([]);

  // Active (enabled + has expression) slots
  const activeSlots = useMemo(
    () => slots.filter((s) => s.enabled && s.expr.trim()),
    [slots]
  );

  // Validate all slots
  const validatedSlots = useMemo(
    () =>
      slots.map((s) => ({
        ...s,
        error: s.expr.trim() ? validateExpr(s.expr) : '',
      })),
    [slots]
  );

  // Compute Y range (auto-scale based on active functions)
  const { yMin, yMax } = useMemo(() => {
    if (activeSlots.length === 0) return { yMin: -5, yMax: 5 };

    let minY = Infinity;
    let maxY = -Infinity;

    const numSamples = 500;
    const dx = (xMax - xMin) / numSamples;

    for (const slot of activeSlots) {
      for (let i = 0; i <= numSamples; i++) {
        const xVal = xMin + i * dx;
        const yVal = safeEval(slot.expr, xVal);
        if (!isNaN(yVal) && Math.abs(yVal) < 1e6) {
          minY = Math.min(minY, yVal);
          maxY = Math.max(maxY, yVal);
        }
      }
    }

    if (!isFinite(minY) || !isFinite(maxY)) return { yMin: -5, yMax: 5 };

    // Add 10% padding
    const range = maxY - minY || 2;
    const padding = range * 0.1;
    return {
      yMin: minY - padding,
      yMax: maxY + padding,
    };
  }, [activeSlots, xMin, xMax]);

  // SVG dimensions
  const SVG_W = 500;
  const SVG_H = 500;

  // Grid ticks
  const ticks = useMemo(() => {
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const xStep = xRange > 20 ? 2 : xRange > 8 ? 1 : xRange > 3 ? 0.5 : 0.25;
    const yStep = yRange > 20 ? 2 : yRange > 8 ? 1 : yRange > 3 ? 0.5 : 0.25;

    const xTicks: number[] = [];
    for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax; v += xStep) {
      xTicks.push(Math.round(v * 10000) / 10000);
    }

    const yTicks: number[] = [];
    for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
      yTicks.push(Math.round(v * 10000) / 10000);
    }

    return { xTicks, yTicks };
  }, [xMin, xMax, yMin, yMax]);

  // Convert math coordinates to SVG
  const toSvgX = useCallback(
    (x: number) => ((x - xMin) / (xMax - xMin)) * SVG_W,
    [xMin, xMax]
  );
  const toSvgY = useCallback(
    (y: number) => SVG_H - ((y - yMin) / (yMax - yMin)) * SVG_H,
    [yMin, yMax]
  );

  // Function paths
  const functionPaths = useMemo(() => {
    return activeSlots.map((slot) => ({
      ...slot,
      path: generateFunctionPath(slot.expr, xMin, xMax, yMin, yMax, SVG_W, SVG_H),
    }));
  }, [activeSlots, xMin, xMax, yMin, yMax]);

  // Compute all intersections (derived value)
  const intersections = useMemo(() => {
    if (activeSlots.length < 2) return [];

    const allIntersections: IntersectionPoint[] = [];
    for (let i = 0; i < activeSlots.length; i++) {
      for (let j = i + 1; j < activeSlots.length; j++) {
        const pts = findIntersectionsBetween(
          activeSlots[i].expr,
          activeSlots[j].expr,
          xMin,
          xMax,
          activeSlots[i].label,
          activeSlots[j].label
        );
        allIntersections.push(...pts);
      }
    }
    allIntersections.sort((a, b) => a.x - b.x);
    return allIntersections;
  }, [activeSlots, xMin, xMax]);

  // Show intersections toggle
  const handleFindIntersections = useCallback(() => {
    setShowIntersections(true);
  }, []);

  // Auto-fit
  const handleAutoFit = useCallback(() => {
    if (activeSlots.length === 0) return;

    // Find reasonable x range from function behavior
    let foundXMin = 0;
    let foundXMax = 0;

    const numSamples = 500;
    const searchMin = -10;
    const searchMax = 10;
    const searchDx = (searchMax - searchMin) / numSamples;

    for (const slot of activeSlots) {
      for (let i = 0; i <= numSamples; i++) {
        const xVal = searchMin + i * searchDx;
        const yVal = safeEval(slot.expr, xVal);
        if (!isNaN(yVal) && Math.abs(yVal) < 1e6) {
          foundXMin = Math.min(foundXMin, xVal);
          foundXMax = Math.max(foundXMax, xVal);
        }
      }
    }

    setXMin(Math.max(-20, Math.round(foundXMin - 0.5)));
    setXMax(Math.min(20, Math.round(foundXMax + 0.5)));
  }, [activeSlots]);

  // Clear all
  const handleClearAll = useCallback(() => {
    setSlots(createDefaultSlots());
    setShowIntersections(true);
    setPresetLatex([]);
    setXMin(-5);
    setXMax(5);
  }, []);

  // Load preset
  const loadPreset = useCallback((preset: Preset) => {
    setSlots((prev) =>
      prev.map((slot, i) => ({
        ...slot,
        expr: preset.functions[i]?.expr || '',
        enabled: preset.functions[i]?.enabled || false,
        error: '',
      }))
    );
    if (preset.xMin !== undefined) setXMin(preset.xMin);
    if (preset.xMax !== undefined) setXMax(preset.xMax);
    else { setXMin(-5); setXMax(5); }
    setIntersections([]);
    setPresetLatex(preset.latex);
  }, []);

  // Update a slot's expression
  const updateSlotExpr = useCallback((id: number, expr: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, expr, error: expr.trim() ? validateExpr(expr) : '' }
          : s
      )
    );
  }, []);

  // Toggle a slot
  const toggleSlot = useCallback((id: number) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  // Clear a slot
  const clearSlot = useCallback((id: number) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, expr: '', error: '', enabled: false } : s
      )
    );
  }, []);

  // Function value table at key positions
  const valueTable = useMemo(() => {
    if (activeSlots.length === 0) return [];

    return KEY_X_POSITIONS.map((xVal) => {
      const values = activeSlots.map((slot) => {
        const yVal = safeEval(slot.expr, xVal);
        return {
          label: slot.label,
          color: slot.color,
          value: isNaN(yVal) ? '—' : yVal.toFixed(3),
        };
      });
      return { x: xVal, values };
    });
  }, [activeSlots]);

  // Intersection result rows
  const intersectionRows = useMemo(() => {
    if (intersections.length === 0) return [];

    return intersections.map((pt) => ({
      label: `x ≈ ${pt.x.toFixed(3)}`,
      value: `${pt.f1Label}(x) = ${pt.f2Label}(x) ≈ ${pt.y.toFixed(3)}`,
      highlight: true,
    }));
  }, [intersections]);

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="∝"
        title="Function Comparison"
        description="Plot & compare multiple functions"
        gradient="from-violet-500 to-purple-500"
      />

      {/* Preset Comparisons */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-bold text-violet-600 dark:text-violet-400">
          Quick Comparisons
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <motion.button
              key={preset.label}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => loadPreset(preset)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-200"
            >
              {preset.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preset LaTeX display */}
      <AnimatePresence>
        {presetLatex.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-center gap-3 py-2 px-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/20">
              {presetLatex.map((tex, i) => (
                <KaTeXRenderer key={i} latex={tex} displayMode={false} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Function Inputs */}
      <Card className="border-violet-200/30 dark:border-violet-800/20 shadow-sm overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/40" />
            <p className="text-[10px] uppercase tracking-widest font-bold text-violet-600 dark:text-violet-400">
              Functions
            </p>
          </div>

          {validatedSlots.map((slot, idx) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-2"
            >
              {/* Color dot */}
              <div
                className={`w-3 h-3 rounded-full ${slot.colorClass} flex-shrink-0 shadow-sm ${
                  slot.enabled && slot.expr.trim() ? 'ring-2 ring-offset-1 ring-offset-background' : 'opacity-40'
                }`}
                style={
                  slot.enabled && slot.expr.trim()
                    ? { ringColor: slot.color }
                    : undefined
                }
              />

              {/* Checkbox */}
              <Checkbox
                checked={slot.enabled}
                onCheckedChange={() => toggleSlot(slot.id)}
                className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />

              {/* Expression input */}
              <div className="flex-1 min-w-0">
                <Input
                  value={slot.expr}
                  onChange={(e) => updateSlotExpr(slot.id, e.target.value)}
                  placeholder={`${slot.label}(x) = ...`}
                  className={`h-8 text-sm font-mono ${slot.error ? 'border-rose-300 dark:border-rose-700 focus-visible:ring-rose-400' : 'border-violet-200/50 dark:border-violet-800/40 focus-visible:ring-violet-400'}`}
                  style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', monospace" }}
                />
              </div>

              {/* Clear button */}
              {slot.expr.trim() && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => clearSlot(slot.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              )}
            </motion.div>
          ))}

          {/* Error display */}
          <AnimatePresence>
            {validatedSlots.some((s) => s.error) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {validatedSlots
                  .filter((s) => s.error)
                  .map((s) => (
                    <p key={s.id} className="text-[11px] text-rose-500 mt-1">
                      <span className="font-bold">{s.label}</span>: {s.error}
                    </p>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Controls Row */}
      <div className="flex flex-wrap items-end gap-3">
        {/* X Range */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-violet-600 dark:text-violet-400">
            X Range
          </label>
          <Input
            type="number"
            value={xMin}
            onChange={(e) => setXMin(parseFloat(e.target.value) || -5)}
            className="w-16 h-8 text-xs font-mono text-center"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="number"
            value={xMax}
            onChange={(e) => setXMax(parseFloat(e.target.value) || 5)}
            className="w-16 h-8 text-xs font-mono text-center"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoFit}
            className="h-8 text-xs border-violet-200/60 dark:border-violet-800/40 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-violet-700 dark:text-violet-300"
          >
            <Maximize2 className="w-3.5 h-3.5 mr-1" />
            Auto Fit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFindIntersections}
            disabled={activeSlots.length < 2}
            className="h-8 text-xs border-violet-200/60 dark:border-violet-800/40 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-violet-700 dark:text-violet-300"
          >
            <Crosshair className="w-3.5 h-3.5 mr-1" />
            Find Intersections
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="h-8 text-xs border-rose-200/60 dark:border-rose-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      {/* SVG Graph */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Card className="overflow-hidden border-violet-200/30 dark:border-violet-800/20 shadow-sm">
          <CardContent className="p-0">
            <div className="aspect-square w-full">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full h-full"
                style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* Clip path to keep curves within chart */}
                  <clipPath id="chart-clip">
                    <rect x={0} y={0} width={SVG_W} height={SVG_H} />
                  </clipPath>
                </defs>

                {/* Background */}
                <rect
                  x={0}
                  y={0}
                  width={SVG_W}
                  height={SVG_H}
                  className="fill-white dark:fill-[#0a0a0a]"
                />

                {/* Grid lines */}
                <g opacity={0.25}>
                  {ticks.xTicks.map((tick) => {
                    const sx = toSvgX(tick);
                    return (
                      <line
                        key={`gx-${tick}`}
                        x1={sx}
                        y1={0}
                        x2={sx}
                        y2={SVG_H}
                        stroke="currentColor"
                        className="text-muted-foreground/50"
                        strokeDasharray="4 4"
                        strokeWidth={0.5}
                      />
                    );
                  })}
                  {ticks.yTicks.map((tick) => {
                    const sy = toSvgY(tick);
                    return (
                      <line
                        key={`gy-${tick}`}
                        x1={0}
                        y1={sy}
                        x2={SVG_W}
                        y2={sy}
                        stroke="currentColor"
                        className="text-muted-foreground/50"
                        strokeDasharray="4 4"
                        strokeWidth={0.5}
                      />
                    );
                  })}
                </g>

                {/* X Axis */}
                {yMin <= 0 && yMax >= 0 && (
                  <>
                    <line
                      x1={0}
                      y1={toSvgY(0)}
                      x2={SVG_W}
                      y2={toSvgY(0)}
                      className="stroke-foreground"
                      strokeWidth={1.2}
                    />
                    {/* X axis tick labels */}
                    {ticks.xTicks.map((tick) => {
                      const sx = toSvgX(tick);
                      const labelY = Math.min(Math.max(toSvgY(0) + 14, 14), SVG_H - 2);
                      return (
                        <g key={`xt-${tick}`}>
                          <line
                            x1={sx}
                            y1={toSvgY(0) - 3}
                            x2={sx}
                            y2={toSvgY(0) + 3}
                            className="stroke-foreground"
                            strokeWidth={1}
                          />
                          <text
                            x={sx}
                            y={labelY}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[9px]"
                          >
                            {Number.isInteger(tick) ? tick.toString() : tick.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* Y Axis */}
                {xMin <= 0 && xMax >= 0 && (
                  <>
                    <line
                      x1={toSvgX(0)}
                      y1={0}
                      x2={toSvgX(0)}
                      y2={SVG_H}
                      className="stroke-foreground"
                      strokeWidth={1.2}
                    />
                    {/* Y axis tick labels */}
                    {ticks.yTicks.map((tick) => {
                      const sy = toSvgY(tick);
                      const labelX = Math.min(Math.max(toSvgX(0) - 6, 2), SVG_W - 14);
                      return (
                        <g key={`yt-${tick}`}>
                          <line
                            x1={toSvgX(0) - 3}
                            y1={sy}
                            x2={toSvgX(0) + 3}
                            y2={sy}
                            className="stroke-foreground"
                            strokeWidth={1}
                          />
                          <text
                            x={labelX}
                            y={sy + 3}
                            textAnchor="end"
                            className="fill-muted-foreground text-[9px]"
                          >
                            {Number.isInteger(tick) ? tick.toString() : tick.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* Function curves */}
                <g clipPath="url(#chart-clip)">
                  {functionPaths.map((fp) => (
                    <motion.path
                      key={fp.id}
                      d={fp.path}
                      fill="none"
                      stroke={fp.color}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  ))}
                </g>

                {/* Intersection points */}
                <AnimatePresence>
                  {showIntersections && intersections.length > 0 && (
                    <g>
                      {intersections.map((pt, i) => {
                        const sx = toSvgX(pt.x);
                        const sy = toSvgY(pt.y);
                        return (
                          <motion.g
                            key={`int-${i}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 20 }}
                          >
                            {/* Outer glow ring */}
                            <circle
                              cx={sx}
                              cy={sy}
                              r={8}
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth={1.5}
                              opacity={0.4}
                            />
                            {/* Inner filled circle */}
                            <circle
                              cx={sx}
                              cy={sy}
                              r={4}
                              fill="#a855f7"
                              stroke="white"
                              strokeWidth={1.5}
                            />
                          </motion.g>
                        );
                      })}
                    </g>
                  )}
                </AnimatePresence>

                {/* Legend */}
                {activeSlots.length > 0 && (
                  <g>
                    <rect
                      x={SVG_W - 130}
                      y={8}
                      width={122}
                      height={activeSlots.length * 18 + 10}
                      rx={6}
                      fill="white"
                      fillOpacity={0.85}
                      stroke="currentColor"
                      className="stroke-border/30"
                      strokeWidth={0.5}
                    />
                    {activeSlots.map((slot, i) => (
                      <g key={`legend-${slot.id}`} transform={`translate(${SVG_W - 122}, ${20 + i * 18})`}>
                        <line
                          x1={0}
                          y1={0}
                          x2={16}
                          y2={0}
                          stroke={slot.color}
                          strokeWidth={2.5}
                          strokeLinecap="round"
                        />
                        <text
                          x={22}
                          y={4}
                          className="fill-foreground text-[10px]"
                          fontWeight={500}
                        >
                          {slot.label}(x) = {slot.expr.length > 12 ? slot.expr.slice(0, 12) + '…' : slot.expr}
                        </text>
                      </g>
                    ))}
                  </g>
                )}
              </svg>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Analysis Panel */}
      <AnimatePresence>
        {activeSlots.length >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-3"
          >
            {/* Range Info */}
            <ResultCard
              title="View Range"
              rows={[
                { label: 'X Range', value: `[${xMin.toFixed(1)}, ${xMax.toFixed(1)}]`, highlight: false },
                { label: 'Y Range', value: `[${yMin.toFixed(2)}, ${yMax.toFixed(2)}]`, highlight: false },
                { label: 'Active Functions', value: `${activeSlots.length} of 4`, highlight: false },
              ]}
            />

            {/* Intersections */}
            {activeSlots.length >= 2 && intersections.length > 0 && (
              <ResultCard
                title="Intersections"
                rows={intersectionRows}
              />
            )}

            {activeSlots.length >= 2 && intersections.length === 0 && (
              <ResultCard
                title="Intersections"
                rows={[]}
                emptyMessage="No intersections found in the current x range"
              />
            )}

            {/* Function Value Table */}
            <Card className="border-violet-200/30 dark:border-violet-800/20 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/40" />
                  <p className="text-[10px] uppercase tracking-widest font-bold text-violet-600 dark:text-violet-400">
                    Function Values
                  </p>
                </div>

                <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-lg border border-border/30">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-muted-foreground border-b border-border/30">
                          x
                        </th>
                        {activeSlots.map((slot) => (
                          <th
                            key={`th-${slot.id}`}
                            className="px-3 py-2 text-right font-bold border-b border-border/30"
                            style={{ color: slot.color }}
                          >
                            {slot.label}(x)
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {valueTable.map((row, i) => (
                        <motion.tr
                          key={row.x}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td
                            className="px-3 py-1.5 font-mono font-bold text-foreground border-b border-border/20"
                            style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                          >
                            {row.x}
                          </td>
                          {row.values.map((v, vi) => (
                            <td
                              key={vi}
                              className="px-3 py-1.5 text-right font-mono border-b border-border/20 text-foreground/80"
                              style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif", color: v.color }}
                            >
                              {v.value}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      <AnimatePresence>
        {activeSlots.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-violet-400" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Enter a function expression to get started
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Try a preset above or type your own
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}