'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import ResultCard from '@/components/onemath/ResultCard';
import KaTeXRenderer from '@/components/onemath/KaTeXRenderer';

// ─── Types ────────────────────────────────────────────────────────────
type RegressionType = 'linear' | 'quadratic' | 'exponential' | 'logarithmic';

interface DataPoint {
  x: number;
  y: number;
}

interface RegressionResult {
  equation: string;
  latex: string;
  r2: number;
  type: RegressionType;
  pointCount: number;
  // Coefficients for plotting
  coeffs: number[];
  predict: (x: number) => number;
}

// ─── Example Datasets ─────────────────────────────────────────────────
const EXAMPLES: { label: string; data: string; type: RegressionType }[] = [
  {
    label: 'Linear Example',
    type: 'linear',
    data: `1, 3.2\n2, 5.1\n3, 6.8\n4, 9.2\n5, 10.9\n6, 13.1\n7, 14.8\n8, 17.2`,
  },
  {
    label: 'Quadratic Example',
    type: 'quadratic',
    data: `1, 1.1\n2, 4.3\n3, 8.9\n4, 16.2\n5, 24.8\n6, 36.1\n7, 48.7\n8, 64.3\n9, 81.2\n10, 100.1`,
  },
  {
    label: 'Exponential Example',
    type: 'exponential',
    data: `0, 1.1\n1, 1.6\n2, 2.7\n3, 4.5\n4, 7.3\n5, 12.1\n6, 20.3\n7, 33.8`,
  },
];

const DEFAULT_DATA = `1, 3.2\n2, 5.1\n3, 6.8\n4, 9.2\n5, 10.9\n6, 13.1\n7, 14.8\n8, 17.2`;

const REGRESSION_LABELS: Record<RegressionType, string> = {
  linear: 'Linear',
  quadratic: 'Quadratic',
  exponential: 'Exponential',
  logarithmic: 'Logarithmic',
};

const REGRESSION_FORMULAS: Record<RegressionType, string> = {
  linear: 'y = ax + b',
  quadratic: 'y = ax² + bx + c',
  exponential: 'y = ae^{bx}',
  logarithmic: 'y = a\\ln(x) + b',
};

// ─── Parse Data ───────────────────────────────────────────────────────
function parseData(text: string): DataPoint[] {
  const lines = text.trim().split('\n');
  const points: DataPoint[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Support both "x, y" and "x y" and "x\ty" formats
    const parts = trimmed.split(/[,\s\t]+/).map(Number);
    if (parts.length >= 2 && isFinite(parts[0]) && isFinite(parts[1])) {
      points.push({ x: parts[0], y: parts[1] });
    }
  }
  return points;
}

// ─── Linear Regression ────────────────────────────────────────────────
function linearRegression(points: DataPoint[]): RegressionResult | null {
  const n = points.length;
  if (n < 2) return null;

  let Sx = 0, Sy = 0, Sxx = 0, Sxy = 0, Syy = 0;
  for (const p of points) {
    Sx += p.x;
    Sy += p.y;
    Sxx += p.x * p.x;
    Sxy += p.x * p.y;
    Syy += p.y * p.y;
  }

  const denom = n * Sxx - Sx * Sx;
  if (Math.abs(denom) < 1e-14) return null;

  const a = (n * Sxy - Sx * Sy) / denom;
  const b = (Sy - a * Sx) / n;

  const r2Denom = (n * Sxx - Sx * Sx) * (n * Syy - Sy * Sy);
  const r2 = r2Denom !== 0 ? Math.pow((n * Sxy - Sx * Sy), 2) / r2Denom : 0;

  const aStr = formatNum(a);
  const bStr = formatNum(Math.abs(b) < 1e-10 ? 0 : b);
  const sign = b >= 0 ? '+' : '-';

  const equation = `y = ${aStr}x ${sign} ${Math.abs(b) < 1e-10 ? '' : formatNum(Math.abs(b))}`.replace(/\+\s*$/, '').replace(/-\s*$/, '');
  const cleanEquation = b >= 0
    ? `y = ${aStr}x + ${bStr}`
    : `y = ${aStr}x - ${formatNum(Math.abs(b))}`;

  const latex = `y = ${katexNum(a)}x ${b >= 0 ? '+' : '-'} ${katexNum(Math.abs(b))}`;

  return {
    equation: cleanEquation,
    latex,
    r2: Math.min(r2, 1),
    type: 'linear',
    pointCount: n,
    coeffs: [a, b],
    predict: (x: number) => a * x + b,
  };
}

// ─── Quadratic Regression (Normal Equations → Gaussian Elimination) ──
function quadraticRegression(points: DataPoint[]): RegressionResult | null {
  const n = points.length;
  if (n < 3) return null;

  let Sx = 0, Sy = 0, Sxx = 0, Sxy = 0, Sx3 = 0, Sx4 = 0, Sx2y = 0;
  for (const p of points) {
    const x = p.x, y = p.y;
    Sx += x;
    Sy += y;
    Sxx += x * x;
    Sxy += x * y;
    Sx3 += x * x * x;
    Sx4 += x * x * x * x;
    Sx2y += x * x * y;
  }

  // Normal equations: [Sx4 Sx3 Sxx; Sx3 Sxx Sx; Sxx Sx n] * [a; b; c] = [Sx2y; Sxy; Sy]
  const matrix = [
    [Sx4, Sx3, Sxx],
    [Sx3, Sxx, Sx],
    [Sxx, Sx, n],
  ];
  const rhs = [Sx2y, Sxy, Sy];

  const sol = gaussianElimination(matrix, rhs);
  if (!sol) return null;

  const [a, b, c] = sol;

  // Compute R²
  const yMean = Sy / n;
  let ssTot = 0, ssRes = 0;
  for (const p of points) {
    const yPred = a * p.x * p.x + b * p.x + c;
    ssTot += (p.y - yMean) ** 2;
    ssRes += (p.y - yPred) ** 2;
  }
  const r2 = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  const equation = buildPolynomialEq([a, b, c]);
  const latex = buildPolynomialLatex([a, b, c]);

  return {
    equation,
    latex,
    r2: Math.min(r2, 1),
    type: 'quadratic',
    pointCount: n,
    coeffs: [a, b, c],
    predict: (x: number) => a * x * x + b * x + c,
  };
}

// ─── Exponential Regression ───────────────────────────────────────────
function exponentialRegression(points: DataPoint[]): RegressionResult | null {
  const validPoints = points.filter(p => p.y > 0);
  const n = validPoints.length;
  if (n < 2) return null;

  // Linearize: ln(y) = ln(a) + bx
  const transformed: DataPoint[] = validPoints.map(p => ({
    x: p.x,
    y: Math.log(p.y),
  }));

  const result = linearRegression(transformed);
  if (!result) return null;

  // result.coeffs: [b_original, ln(a)]
  const bCoeff = result.coeffs[0];
  const lnA = result.coeffs[1];
  const aVal = Math.exp(lnA);

  // Compute R² on original data
  const yMean = validPoints.reduce((s, p) => s + p.y, 0) / n;
  let ssTot = 0, ssRes = 0;
  for (const p of validPoints) {
    const yPred = aVal * Math.exp(bCoeff * p.x);
    ssTot += (p.y - yMean) ** 2;
    ssRes += (p.y - yPred) ** 2;
  }
  const r2 = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  const aStr = formatNum(aVal);
  const bStr = formatNum(bCoeff);
  const latex = `y = ${katexNum(aVal)} \\cdot e^{${katexNum(bCoeff)}x}`;
  const equation = `y = ${aStr} · e^(${bStr}x)`;

  return {
    equation,
    latex,
    r2: Math.min(r2, 1),
    type: 'exponential',
    pointCount: n,
    coeffs: [aVal, bCoeff],
    predict: (x: number) => aVal * Math.exp(bCoeff * x),
  };
}

// ─── Logarithmic Regression ───────────────────────────────────────────
function logarithmicRegression(points: DataPoint[]): RegressionResult | null {
  const validPoints = points.filter(p => p.x > 0);
  const n = validPoints.length;
  if (n < 2) return null;

  // Let u = ln(x), fit y = a*u + b
  const transformed: DataPoint[] = validPoints.map(p => ({
    x: Math.log(p.x),
    y: p.y,
  }));

  const result = linearRegression(transformed);
  if (!result) return null;

  const aCoeff = result.coeffs[0];
  const bCoeff = result.coeffs[1];

  // Compute R² on original data
  const yMean = validPoints.reduce((s, p) => s + p.y, 0) / n;
  let ssTot = 0, ssRes = 0;
  for (const p of validPoints) {
    const yPred = aCoeff * Math.log(p.x) + bCoeff;
    ssTot += (p.y - yMean) ** 2;
    ssRes += (p.y - yPred) ** 2;
  }
  const r2 = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  const aStr = formatNum(aCoeff);
  const bStr = formatNum(bCoeff);
  const sign = bCoeff >= 0 ? '+' : '-';
  const latex = `y = ${katexNum(aCoeff)} \\ln(x) ${sign} ${katexNum(Math.abs(bCoeff))}`;
  const equation = bCoeff >= 0
    ? `y = ${aStr} · ln(x) + ${bStr}`
    : `y = ${aStr} · ln(x) - ${formatNum(Math.abs(bCoeff))}`;

  return {
    equation,
    latex,
    r2: Math.min(r2, 1),
    type: 'logarithmic',
    pointCount: n,
    coeffs: [aCoeff, bCoeff],
    predict: (x: number) => (x > 0 ? aCoeff * Math.log(x) + bCoeff : NaN),
  };
}

// ─── Gaussian Elimination ─────────────────────────────────────────────
function gaussianElimination(
  matrix: number[][],
  rhs: number[]
): number[] | null {
  const n = matrix.length;
  // Build augmented matrix
  const aug: number[][] = matrix.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }
    if (maxVal < 1e-14) return null;
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Back substitution
  const solution = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * solution[j];
    }
    solution[i] = sum / aug[i][i];
    if (!isFinite(solution[i])) return null;
  }

  return solution;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function formatNum(n: number): string {
  if (Math.abs(n) < 1e-10) return '0';
  if (Math.abs(n) >= 1000) return n.toFixed(2);
  if (Math.abs(n) >= 10) return n.toFixed(3);
  if (Math.abs(n) >= 1) return n.toFixed(4);
  return n.toFixed(4);
}

function katexNum(n: number): string {
  if (Math.abs(n) < 1e-10) return '0';
  return formatNum(n);
}

function buildPolynomialEq(c: number[]): string {
  const [a, b, cc] = c;
  const parts: string[] = ['y ='];
  if (Math.abs(a) > 1e-10) parts.push(`${formatNum(a)}x²`);
  if (Math.abs(b) > 1e-10) parts.push(`${b >= 0 ? '+' : '-'} ${formatNum(Math.abs(b))}x`);
  if (Math.abs(cc) > 1e-10) parts.push(`${cc >= 0 ? '+' : '-'} ${formatNum(Math.abs(cc))}`);
  if (parts.length === 1) parts.push('0');
  return parts.join(' ');
}

function buildPolynomialLatex(c: number[]): string {
  const [a, b, cc] = c;
  let latex = 'y = ';
  const terms: string[] = [];
  if (Math.abs(a) > 1e-10) terms.push(`${katexNum(a)}x^2`);
  if (Math.abs(b) > 1e-10) terms.push(`${b > 0 && terms.length > 0 ? '+' : '-'} ${katexNum(Math.abs(b))}x`);
  if (Math.abs(cc) > 1e-10) terms.push(`${cc > 0 && terms.length > 0 ? '+' : '-'} ${katexNum(Math.abs(cc))}`);
  if (terms.length === 0) terms.push('0');
  // Clean up first term sign
  if (terms[0].startsWith('- ')) terms[0] = '-' + terms[0].slice(2);
  latex += terms.join(' ');
  return latex;
}

// ─── Compute Regression ──────────────────────────────────────────────
function computeRegression(
  points: DataPoint[],
  type: RegressionType
): RegressionResult | null {
  switch (type) {
    case 'linear':
      return linearRegression(points);
    case 'quadratic':
      return quadraticRegression(points);
    case 'exponential':
      return exponentialRegression(points);
    case 'logarithmic':
      return logarithmicRegression(points);
  }
}

// ─── SVG Scatter Plot ─────────────────────────────────────────────────
function ScatterPlot({
  points,
  result,
}: {
  points: DataPoint[];
  result: RegressionResult | null;
}) {
  if (points.length === 0) return null;

  const width = 600;
  const height = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Compute data range
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const p of points) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }

  // If regression result, extend range for curve
  if (result) {
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = xMin - (xMax - xMin) * 0.05 + (i / steps) * (xMax - xMin) * 1.1;
      const y = result.predict(x);
      if (isFinite(y)) {
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
  }

  // Add 10% padding
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  xMin -= xRange * 0.08;
  xMax += xRange * 0.08;
  yMin -= yRange * 0.08;
  yMax += yRange * 0.08;

  const scaleX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const scaleY = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Grid lines
  const gridLines: { x1: number; y1: number; x2: number; y2: number; label?: string; axis?: 'x' | 'y' }[] = [];

  // Y-axis grid
  const yTicks = niceScale(yMin, yMax, 5);
  for (const tick of yTicks) {
    gridLines.push({
      x1: padding.left,
      y1: scaleY(tick),
      x2: padding.left + plotW,
      y2: scaleY(tick),
      label: formatNum(tick),
      axis: 'y',
    });
  }

  // X-axis grid
  const xTicks = niceScale(xMin, xMax, 6);
  for (const tick of xTicks) {
    gridLines.push({
      x1: scaleX(tick),
      y1: padding.top,
      x2: scaleX(tick),
      y2: padding.top + plotH,
      label: formatNum(tick),
      axis: 'x',
    });
  }

  // Regression curve path
  let curvePath = '';
  if (result) {
    const steps = 200;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = result.predict(x);
      if (isFinite(y)) {
        const px = scaleX(x);
        const py = scaleY(y);
        if (py >= padding.top - 5 && py <= padding.top + plotH + 5) {
          pts.push(`${px},${py}`);
        }
      }
    }
    if (pts.length > 1) {
      curvePath = `M${pts[0]} ` + pts.slice(1).map(p => `L${p}`).join(' ');
    }
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      style={{ maxHeight: '300px' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x={padding.left} y={padding.top} width={plotW} height={plotH} fill="transparent" />

      {/* Grid lines */}
      {gridLines.map((line, i) => (
        <line
          key={`grid-${i}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="currentColor"
          className="text-border"
          strokeWidth={0.5}
          strokeDasharray={line.axis ? 'none' : '3,3'}
        />
      ))}

      {/* Axes */}
      <line
        x1={padding.left}
        y1={padding.top + plotH}
        x2={padding.left + plotW}
        y2={padding.top + plotH}
        stroke="currentColor"
        className="text-foreground/60"
        strokeWidth={1.2}
      />
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + plotH}
        stroke="currentColor"
        className="text-foreground/60"
        strokeWidth={1.2}
      />

      {/* Tick labels */}
      {gridLines.map((line, i) => {
        if (!line.label) return null;
        if (line.axis === 'x') {
          return (
            <text
              key={`label-${i}`}
              x={line.x1}
              y={padding.top + plotH + 18}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={9}
              fontFamily="'Latin Modern Math', serif"
            >
              {line.label}
            </text>
          );
        }
        return (
          <text
            key={`label-${i}`}
            x={padding.left - 8}
            y={line.y1 + 3}
            textAnchor="end"
            className="fill-muted-foreground"
            fontSize={9}
            fontFamily="'Latin Modern Math', serif"
          >
            {line.label}
          </text>
        );
      })}

      {/* Axis labels */}
      <text
        x={padding.left + plotW / 2}
        y={height - 2}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={10}
        fontFamily="'Latin Modern Math', serif"
      >
        X
      </text>
      <text
        x={14}
        y={padding.top + plotH / 2}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={10}
        fontFamily="'Latin Modern Math', serif"
        transform={`rotate(-90, 14, ${padding.top + plotH / 2})`}
      >
        Y
      </text>

      {/* Regression curve */}
      {curvePath && (
        <motion.path
          d={curvePath}
          fill="none"
          className="stroke-emerald-500 dark:stroke-emerald-400"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}

      {/* Data points */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={scaleX(p.x)}
          cy={scaleY(p.y)}
          r={4.5}
          className="fill-emerald-600 dark:fill-emerald-400"
          stroke="white"
          strokeWidth={1.5}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.03 * i, type: 'spring', stiffness: 400, damping: 25 }}
        />
      ))}
    </svg>
  );
}

function niceScale(min: number, max: number, targetTicks: number): number[] {
  const range = max - min;
  if (range <= 0) return [min];
  const roughStep = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / mag;
  let niceStep: number;
  if (residual <= 1.5) niceStep = mag;
  else if (residual <= 3.5) niceStep = 2 * mag;
  else if (residual <= 7.5) niceStep = 5 * mag;
  else niceStep = 10 * mag;

  const ticks: number[] = [];
  let tick = Math.ceil(min / niceStep) * niceStep;
  while (tick <= max) {
    ticks.push(tick);
    tick += niceStep;
  }
  return ticks;
}

// ─── Component ────────────────────────────────────────────────────────
export default function RegressionCalculator() {
  const [dataText, setDataText] = useState(DEFAULT_DATA);
  const [regressionType, setRegressionType] = useState<RegressionType>('linear');
  const [computed, setComputed] = useState(false);

  const points = useMemo(() => parseData(dataText), [dataText]);

  const result = useMemo(() => {
    if (!computed || points.length < 2) return null;
    return computeRegression(points, regressionType);
  }, [computed, points, regressionType]);

  const handleCompute = () => {
    setComputed(true);
  };

  const handleLoadExample = (example: (typeof EXAMPLES)[number]) => {
    setDataText(example.data);
    setRegressionType(example.type);
    setComputed(true);
  };

  const handleCopyEquation = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.latex);
    } catch {
      // Clipboard may not be available
    }
  };

  return (
    <div className="space-y-5">
      <FeatureHeader
        icon="📈"
        title="Regression Calculator"
        description="Curve fitting & regression analysis on data points"
        gradient="from-emerald-500 to-teal-600"
      />

      {/* Data Input */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">
              Data Points
            </p>
            <p className="text-[10px] text-muted-foreground">
              {points.length} point{points.length !== 1 ? 's' : ''} parsed
            </p>
          </div>

          <Textarea
            value={dataText}
            onChange={(e) => {
              setDataText(e.target.value);
              setComputed(false);
            }}
            placeholder="Enter X,Y pairs (one per line)&#10;Format: x, y or x y&#10;Example:&#10;1, 3.2&#10;2, 5.1&#10;3, 6.8"
            className="font-mono text-xs min-h-[120px] max-h-48 resize-y number-math"
            style={{ fontFamily: "'Latin Modern Math', 'Fira Code', monospace" }}
          />

          {/* Example Data Buttons */}
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <motion.div
                key={ex.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 px-2.5 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  onClick={() => handleLoadExample(ex)}
                >
                  {ex.label}
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regression Type Selection */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">
            Regression Type
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['linear', 'quadratic', 'exponential', 'logarithmic'] as RegressionType[]).map(
              (type) => {
                const isActive = regressionType === type;
                return (
                  <motion.div key={type} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className={`w-full text-[11px] h-9 transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:from-emerald-600 hover:to-teal-700'
                          : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-emerald-300/60'
                      }`}
                      onClick={() => {
                        setRegressionType(type);
                        setComputed(false);
                      }}
                    >
                      <span className="number-math" style={{ fontFamily: "'Latin Modern Math', serif" }}>
                        {REGRESSION_LABELS[type]}
                      </span>
                    </Button>
                  </motion.div>
                );
              }
            )}
          </div>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-1">
            <Button
              onClick={handleCompute}
              disabled={points.length < 2}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md font-bold text-sm h-10"
            >
              Compute Regression
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Equation Display */}
          <Card className="border-emerald-200/40 dark:border-emerald-800/30 shadow-sm overflow-hidden bg-gradient-to-br from-emerald-50/30 via-card to-teal-50/20 dark:from-emerald-950/10 dark:via-card dark:to-teal-950/5">
            <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 dark:from-emerald-500 dark:via-teal-500 dark:to-emerald-400" />
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
                    Equation
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] h-7 px-2.5 text-muted-foreground hover:text-foreground"
                    onClick={handleCopyEquation}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Copy LaTeX
                  </Button>
                </motion.div>
              </div>

              <div className="math-display py-1">
                <KaTeXRenderer latex={result.latex} displayMode={true} className="text-lg" />
              </div>
            </CardContent>
          </Card>

          {/* Result Details */}
          <ResultCard
            title="Analysis Results"
            KaTeXRenderer={KaTeXRenderer}
            rows={[
              {
                label: 'Regression Type',
                value: REGRESSION_LABELS[result.type],
                highlight: false,
              },
              {
                label: 'Equation',
                value: result.equation,
                highlight: true,
              },
              {
                label: 'R² Value',
                value: result.r2.toFixed(6),
                highlight: result.r2 > 0.9,
              },
              {
                label: 'Number of Points',
                value: String(result.pointCount),
                highlight: false,
              },
            ]}
          />

          {/* Scatter Plot */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 dark:from-emerald-500 dark:via-teal-500 dark:to-emerald-400" />
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
                  Scatter Plot
                </p>
              </div>
              <ScatterPlot points={points} result={result} />
              <div className="flex items-center justify-center gap-5 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  <span className="text-[10px] text-muted-foreground">Data Points</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full" />
                  <span className="text-[10px] text-muted-foreground number-math" style={{ fontFamily: "'Latin Modern Math', serif" }}>
                    {REGRESSION_LABELS[regressionType]} Fit
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formula Reference */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
                  Model Formula
                </p>
              </div>
              <div className="math-display">
                <KaTeXRenderer
                  latex={REGRESSION_FORMULAS[regressionType]}
                  displayMode={true}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {!result && computed && points.length >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <p className="text-sm text-muted-foreground">
            Could not compute regression. Check your data for the selected type.
          </p>
        </motion.div>
      )}

      {!computed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <p className="text-sm text-muted-foreground">
            Enter data points and click &quot;Compute Regression&quot; to see results.
          </p>
        </motion.div>
      )}
    </div>
  );
}