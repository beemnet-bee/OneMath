'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import ResultCard from '@/components/onemath/ResultCard';
import KaTeXRenderer from '@/components/onemath/KaTeXRenderer';

// ── Types ──

type Mode = 'distance' | 'midpoint' | 'lineEq' | 'intersection' | 'pointLine' | 'circle' | 'triangle';

interface CalcResult {
  formulaLatex: string;
  rows: { label: string; value: string; highlight?: boolean }[];
  latex: string[];
}

// ── Modes ──

const modes: { id: Mode; label: string }[] = [
  { id: 'distance', label: 'Distance' },
  { id: 'midpoint', label: 'Midpoint' },
  { id: 'lineEq', label: 'Line Eq' },
  { id: 'intersection', label: 'Intersect' },
  { id: 'pointLine', label: 'Pt → Line' },
  { id: 'circle', label: 'Circle' },
  { id: 'triangle', label: 'Triangle' },
];

// ── Styles ──

const inputCls =
  'w-full h-10 px-3 rounded-xl bg-muted/60 border border-border text-sm text-foreground text-center outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 dark:bg-muted/40';
const labelCls = 'text-[11px] text-muted-foreground font-medium';
const mathFont = { fontFamily: "'Latin Modern Math', 'STIX Two Math', 'Cambria Math', serif" };

// ── Helpers ──

function fmt(n: number, d = 4): string {
  if (!Number.isFinite(n)) return 'Undefined';
  const s = n.toFixed(d);
  return s.replace(/\.?0+$/, '');
}

function fmtSigned(n: number, d = 4): string {
  if (!Number.isFinite(n)) return 'Undefined';
  const abs = fmt(Math.abs(n), d);
  if (n < 0) return `-${abs}`;
  if (n > 0) return `+${abs}`;
  return abs;
}

function toNum(v: string, fallback = 0): number {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function gcd2(a: number, b: number): number {
  a = Math.round(Math.abs(a));
  b = Math.round(Math.abs(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

function gcd3(a: number, b: number, c: number): number {
  return gcd2(gcd2(a, b), c);
}

// ── Pure Calculation Functions ──

function calcDistance(x1: number, y1: number, x2: number, y2: number): CalcResult {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return {
    formulaLatex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}',
    rows: [
      { label: 'Δx', value: fmt(dx) },
      { label: 'Δy', value: fmt(dy) },
      { label: 'Distance', value: fmt(dist), highlight: true },
      { label: 'Distance²', value: fmt(dist * dist) },
    ],
    latex: [`d = \\sqrt{(${fmtSigned(dx)})^2 + (${fmtSigned(dy)})^2} = ${fmt(dist)}`],
  };
}

function calcMidpoint(x1: number, y1: number, x2: number, y2: number): CalcResult {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return {
    formulaLatex: 'M = \\left(\\frac{x_1 + x_2}{2},\\; \\frac{y_1 + y_2}{2}\\right)',
    rows: [
      { label: 'Midpoint', value: `(${fmt(mx)}, ${fmt(my)})`, highlight: true },
      { label: 'Avg x', value: fmt(mx) },
      { label: 'Avg y', value: fmt(my) },
    ],
    latex: [`M = \\left(\\frac{${fmt(x1)} + ${fmt(x2)}}{2},\\; \\frac{${fmt(y1)} + ${fmt(y2)}}{2}\\right) = (${fmt(mx)},\\; ${fmt(my)})`],
  };
}

function calcLineEq(X1: number, Y1: number, X2: number, Y2: number): CalcResult {
  const dx = X2 - X1;
  if (dx === 0) {
    return {
      formulaLatex: 'x = k \\quad (\\text{vertical line})',
      rows: [
        { label: 'Type', value: 'Vertical Line', highlight: true },
        { label: 'Equation', value: `x = ${fmt(X1)}` },
        { label: 'Slope', value: 'Undefined (∞)' },
      ],
      latex: [`x = ${fmt(X1)}`],
    };
  }

  const slope = (Y2 - Y1) / dx;
  const intercept = Y1 - slope * X1;

  const bStr = intercept === 0 ? '' : intercept < 0 ? ` - ${fmt(Math.abs(intercept))}` : ` + ${fmt(intercept)}`;
  const slopeStr = slope === 1 ? '' : slope === -1 ? '-' : fmt(slope);
  const slopeIntercept = `y = ${slopeStr === '' ? '' : slopeStr + 'x'}${bStr}`.replace('y =  -', 'y = -');

  const pointSlope = `y - ${fmt(Y1)} = ${fmt(slope)}(x - ${fmt(X1)})`;

  // Standard form: Ax + By + C = 0
  let A = slope, B = -1, C = intercept;
  if (A < 0 || (A === 0 && B < 0) || (A === 0 && B === 0 && C < 0)) {
    A = -A; B = -B; C = -C;
  }
  const g = gcd3(Math.abs(A), Math.abs(B), Math.abs(C));
  if (g > 1) { A /= g; B /= g; C /= g; }

  let stdParts: string[] = [];
  if (A !== 0) stdParts.push(`${A === 1 ? '' : fmt(A)}x`);
  if (B !== 0) stdParts.push(`${B === 1 ? '' : B === -1 ? '-' : fmt(B)}y`);
  if (C !== 0) stdParts.push(fmtSigned(C));
  const standardStr = stdParts.join(' ') + ' = 0';

  return {
    formulaLatex: 'y = mx + b,\\quad m = \\frac{y_2 - y_1}{x_2 - x_1}',
    rows: [
      { label: 'Slope (m)', value: fmt(slope), highlight: true },
      { label: 'Y-intercept (b)', value: fmt(intercept) },
      { label: 'Slope-Intercept', value: slopeIntercept, highlight: true },
      { label: 'Point-Slope', value: pointSlope },
      { label: 'Standard Form', value: standardStr },
      { label: 'Rise / Run', value: `${fmt(Y2 - Y1)} / ${fmt(dx)}` },
    ],
    latex: [
      `y = ${fmt(slope)}x ${fmtSigned(intercept)}`,
      `y - ${fmt(Y1)} = ${fmt(slope)}(x - ${fmt(X1)})`,
      `${fmt(A)}x ${fmtSigned(B)}y ${fmtSigned(C)} = 0`,
    ],
  };
}

function calcIntersection(M1: number, B1: number, M2: number, B2: number): CalcResult {
  if (Math.abs(M1 - M2) < 1e-12) {
    if (Math.abs(B1 - B2) < 1e-12) {
      return {
        formulaLatex: 'm_1 x + b_1 = m_2 x + b_2',
        rows: [{ label: 'Result', value: 'Lines are coincident (same line)', highlight: true }],
        latex: [`m_1 = m_2 = ${fmt(M1)}`],
      };
    }
    return {
      formulaLatex: 'm_1 x + b_1 = m_2 x + b_2',
      rows: [{ label: 'Result', value: 'Lines are parallel (no intersection)', highlight: true }],
      latex: [`m_1 = m_2 = ${fmt(M1)},\\; b_1 \\neq b_2`],
    };
  }

  const ix = (B2 - B1) / (M1 - M2);
  const iy = M1 * ix + B1;
  const angle = Math.abs(Math.atan((M1 - M2) / (1 + M1 * M2))) * 180 / Math.PI;

  return {
    formulaLatex: 'm_1 x + b_1 = m_2 x + b_2',
    rows: [
      { label: 'Line 1', value: `y = ${fmt(M1)}x ${fmtSigned(B1)}` },
      { label: 'Line 2', value: `y = ${fmt(M2)}x ${fmtSigned(B2)}` },
      { label: 'Intersection', value: `(${fmt(ix)}, ${fmt(iy)})`, highlight: true },
      { label: 'Angle', value: `${fmt(angle, 2)}°` },
    ],
    latex: [
      `${fmt(M1)}x ${fmtSigned(B1)} = ${fmt(M2)}x ${fmtSigned(B2)}`,
      `x = ${fmt(ix)},\\quad y = ${fmt(iy)}`,
    ],
  };
}

function calcPointLine(PX: number, PY: number, A: number, B: number, C: number): CalcResult {
  const denom = Math.sqrt(A * A + B * B);
  const dist = denom === 0 ? 0 : Math.abs(A * PX + B * PY + C) / denom;
  const k = denom === 0 ? 0 : -(A * PX + B * PY + C) / (A * A + B * B);
  const fx = PX + A * k, fy = PY + B * k;

  return {
    formulaLatex: 'd = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}',
    rows: [
      { label: 'Line', value: `${fmt(A)}x ${fmtSigned(B)}y ${fmtSigned(C)} = 0` },
      { label: 'Point', value: `(${fmt(PX)}, ${fmt(PY)})` },
      { label: 'Distance', value: fmt(dist), highlight: true },
      { label: 'Foot of ⊥', value: `(${fmt(fx)}, ${fmt(fy)})` },
    ],
    latex: [
      `d = \\frac{|${fmt(A)} \\cdot ${fmt(PX)} + ${fmt(B)} \\cdot ${fmt(PY)} + ${fmt(C)}|}{\\sqrt{${fmt(A)}^2 + ${fmt(B)}^2}} = ${fmt(dist)}`,
    ],
  };
}

function calcCircleCenter(H: number, K: number, R: number): CalcResult {
  const rSq = R * R;
  const hStr = H === 0 ? 'x' : H > 0 ? `(x - ${fmt(H)})` : `(x + ${fmt(Math.abs(H))})`;
  const kStr = K === 0 ? 'y' : K > 0 ? `(y - ${fmt(K)})` : `(y + ${fmt(Math.abs(K))})`;
  const D = -2 * H, E = -2 * K, F = H * H + K * K - rSq;

  return {
    formulaLatex: '(x - h)^2 + (y - k)^2 = r^2',
    rows: [
      { label: 'Center', value: `(${fmt(H)}, ${fmt(K)})`, highlight: true },
      { label: 'Radius', value: fmt(R), highlight: true },
      { label: 'Diameter', value: fmt(2 * R) },
      { label: 'Circumference', value: fmt(2 * Math.PI * R) },
      { label: 'Area', value: fmt(Math.PI * rSq) },
    ],
    latex: [
      `${hStr}^2 + ${kStr}^2 = ${fmt(rSq)}`,
      `x^2 + y^2 ${fmtSigned(D)}x ${fmtSigned(E)}y ${fmtSigned(F)} = 0`,
    ],
  };
}

function calcCircleThree(X1: number, Y1: number, X2: number, Y2: number, X3: number, Y3: number): CalcResult {
  const D = 2 * (X1 * (Y2 - Y3) + X2 * (Y3 - Y1) + X3 * (Y1 - Y2));
  if (Math.abs(D) < 1e-12) {
    return {
      formulaLatex: '\\text{Find }(h,k,r)\\text{ from 3 points}',
      rows: [{ label: 'Result', value: 'Points are collinear — no unique circle', highlight: false }],
      latex: [],
    };
  }

  const rSq1 = X1 * X1 + Y1 * Y1;
  const rSq2 = X2 * X2 + Y2 * Y2;
  const rSq3 = X3 * X3 + Y3 * Y3;
  const H = (rSq1 * (Y2 - Y3) + rSq2 * (Y3 - Y1) + rSq3 * (Y1 - Y2)) / D;
  const K = (rSq1 * (X3 - X2) + rSq2 * (X1 - X3) + rSq3 * (X2 - X1)) / D;
  const R = Math.sqrt((X1 - H) ** 2 + (Y1 - K) ** 2);
  const rSq = R * R;
  const Dstd = -2 * H, Estd = -2 * K, Fstd = H * H + K * K - rSq;

  return {
    formulaLatex: '\\text{Find }(h,k,r)\\text{ such that all 3 points satisfy }(x-h)^2+(y-k)^2=r^2',
    rows: [
      { label: 'Center', value: `(${fmt(H)}, ${fmt(K)})`, highlight: true },
      { label: 'Radius', value: fmt(R), highlight: true },
      { label: 'Circumference', value: fmt(2 * Math.PI * R) },
      { label: 'Area', value: fmt(Math.PI * rSq) },
    ],
    latex: [
      `(x - ${fmt(H)})^2 + (y - ${fmt(K)})^2 = ${fmt(rSq)}`,
      `x^2 + y^2 ${fmtSigned(Dstd)}x ${fmtSigned(Estd)}y ${fmtSigned(Fstd)} = 0`,
    ],
  };
}

function calcTriangle(X1: number, Y1: number, X2: number, Y2: number, X3: number, Y3: number): CalcResult {
  const cross = (X2 - X1) * (Y3 - Y1) - (X3 - X1) * (Y2 - Y1);
  const area = Math.abs(cross) / 2;
  const a = Math.sqrt((X2 - X3) ** 2 + (Y2 - Y3) ** 2);
  const bLen = Math.sqrt((X1 - X3) ** 2 + (Y1 - Y3) ** 2);
  const c = Math.sqrt((X1 - X2) ** 2 + (Y1 - Y2) ** 2);
  const perimeter = a + bLen + c;

  return {
    formulaLatex: 'A = \\frac{1}{2} |(x_2 - x_1)(y_3 - y_1) - (x_3 - x_1)(y_2 - y_1)|',
    rows: [
      { label: 'Area', value: fmt(area), highlight: true },
      { label: 'Perimeter', value: fmt(perimeter) },
      { label: 'Side a (BC)', value: fmt(a) },
      { label: 'Side b (AC)', value: fmt(bLen) },
      { label: 'Side c (AB)', value: fmt(c) },
      { label: 'Semi-perimeter', value: fmt(perimeter / 2) },
    ],
    latex: [
      `A = \\tfrac{1}{2}\\left|(${fmt(X2)}-${fmt(X1)})(${fmt(Y3)}-${fmt(Y1)}) - (${fmt(X3)}-${fmt(X1)})(${fmt(Y2)}-${fmt(Y1)})\\right| = ${fmt(area)}`,
    ],
  };
}

// ── Compact Input Pair ──

function PointInput({
  label,
  x,
  y,
  onX,
  onY,
}: {
  label: string;
  x: string;
  y: string;
  onX: (v: string) => void;
  onY: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className={labelCls}>{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">(</span>
        <Input
          type="number"
          value={x}
          onChange={(e) => onX(e.target.value)}
          className={`${inputCls} w-20`}
          aria-label={`${label} x`}
        />
        <span className="text-xs text-muted-foreground">,</span>
        <Input
          type="number"
          value={y}
          onChange={(e) => onY(e.target.value)}
          className={`${inputCls} w-20`}
          aria-label={`${label} y`}
        />
        <span className="text-xs text-muted-foreground">)</span>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function CoordinateGeometry() {
  const [mode, setMode] = useState<Mode>('distance');

  // Distance / Midpoint
  const [x1, setX1] = useState('1');
  const [y1, setY1] = useState('2');
  const [x2, setX2] = useState('4');
  const [y2, setY2] = useState('6');

  // Line Equation
  const [lx1, setLx1] = useState('0');
  const [ly1, setLy1] = useState('0');
  const [lx2, setLx2] = useState('3');
  const [ly2, setLy2] = useState('6');

  // Line Intersection
  const [m1, setM1] = useState('2');
  const [b1, setB1] = useState('1');
  const [m2, setM2] = useState('-1');
  const [b2, setB2] = useState('7');

  // Point to Line
  const [px, setPx] = useState('1');
  const [py, setPy] = useState('2');
  const [la, setLa] = useState('3');
  const [lb, setLb] = useState('4');
  const [lc, setLc] = useState('5');

  // Circle
  const [circleMode, setCircleMode] = useState<'center' | 'threePoints'>('center');
  const [ch, setCh] = useState('2');
  const [ck, setCk] = useState('-3');
  const [cr, setCr] = useState('5');
  const [cx1, setCx1] = useState('0');
  const [cy1, setCy1] = useState('0');
  const [cx2, setCx2] = useState('6');
  const [cy2, setCy2] = useState('0');
  const [cx3, setCx3] = useState('3');
  const [cy3, setCy3] = useState('4');

  // Triangle
  const [tx1, setTx1] = useState('0');
  const [ty1, setTy1] = useState('0');
  const [tx2, setTx2] = useState('5');
  const [ty2, setTy2] = useState('0');
  const [tx3, setTx3] = useState('0');
  const [ty3, setTy3] = useState('4');

  // ── Derived results via useMemo ──

  const result: CalcResult = useMemo(() => {
    if (mode === 'distance') return calcDistance(toNum(x1), toNum(y1), toNum(x2), toNum(y2));
    if (mode === 'midpoint') return calcMidpoint(toNum(x1), toNum(y1), toNum(x2), toNum(y2));
    if (mode === 'lineEq') return calcLineEq(toNum(lx1), toNum(ly1), toNum(lx2), toNum(ly2));
    if (mode === 'intersection') return calcIntersection(toNum(m1), toNum(b1), toNum(m2), toNum(b2));
    if (mode === 'pointLine') return calcPointLine(toNum(px), toNum(py), toNum(la), toNum(lb), toNum(lc));
    if (mode === 'circle') {
      if (circleMode === 'center') return calcCircleCenter(toNum(ch), toNum(ck), toNum(cr));
      return calcCircleThree(toNum(cx1), toNum(cy1), toNum(cx2), toNum(cy2), toNum(cx3), toNum(cy3));
    }
    if (mode === 'triangle') return calcTriangle(toNum(tx1), toNum(ty1), toNum(tx2), toNum(ty2), toNum(tx3), toNum(ty3));
    return { formulaLatex: '', rows: [], latex: [] };
    }, [mode, circleMode, x1, y1, x2, y2, lx1, ly1, lx2, ly2, m1, b1, m2, b2, px, py, la, lb, lc, ch, ck, cr, cx1, cy1, cx2, cy2, cx3, cy3, tx1, ty1, tx2, ty2, tx3, ty3]);

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="📐"
        title="Coordinate Geometry"
        description="Distance, midpoint, lines, circles & triangles"
      />

      {/* Mode Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-1.5 p-1 bg-muted/60 rounded-xl"
      >
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 min-w-0 py-2 px-2 text-[11px] font-semibold rounded-lg transition-all truncate ${
              mode === m.id
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
      </motion.div>

      {/* Formula Display */}
      {result.formulaLatex && (
        <motion.div
          key={`formula-${mode}-${circleMode}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/40 dark:border-emerald-800/30"
          style={mathFont}
        >
          <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Formula</p>
          <KaTeXRenderer latex={result.formulaLatex} className="text-sm text-foreground" />
        </motion.div>
      )}

      {/* Input Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── Distance / Midpoint ── */}
          {(mode === 'distance' || mode === 'midpoint') && (
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <PointInput label="Point 1 (x₁, y₁)" x={x1} y={y1} onX={setX1} onY={setY1} />
                <PointInput label="Point 2 (x₂, y₂)" x={x2} y={y2} onX={setX2} onY={setY2} />
              </CardContent>
            </Card>
          )}

          {/* ── Line Equation ── */}
          {mode === 'lineEq' && (
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <PointInput label="Point 1 (x₁, y₁)" x={lx1} y={ly1} onX={setLx1} onY={setLy1} />
                <PointInput label="Point 2 (x₂, y₂)" x={lx2} y={ly2} onX={setLx2} onY={setLy2} />
              </CardContent>
            </Card>
          )}

          {/* ── Line Intersection ── */}
          {mode === 'intersection' && (
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <p className={labelCls}>Line 1 — y = m₁x + b₁</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">m₁ =</span>
                    <Input type="number" value={m1} onChange={(e) => setM1(e.target.value)} className={`${inputCls} w-20`} />
                    <span className="text-xs text-muted-foreground">b₁ =</span>
                    <Input type="number" value={b1} onChange={(e) => setB1(e.target.value)} className={`${inputCls} w-20`} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className={labelCls}>Line 2 — y = m₂x + b₂</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">m₂ =</span>
                    <Input type="number" value={m2} onChange={(e) => setM2(e.target.value)} className={`${inputCls} w-20`} />
                    <span className="text-xs text-muted-foreground">b₂ =</span>
                    <Input type="number" value={b2} onChange={(e) => setB2(e.target.value)} className={`${inputCls} w-20`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Point to Line Distance ── */}
          {mode === 'pointLine' && (
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <PointInput label="Point (x₀, y₀)" x={px} y={py} onX={setPx} onY={setPy} />
                <div className="space-y-1.5">
                  <p className={labelCls}>Line — Ax + By + C = 0</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">A =</span>
                    <Input type="number" value={la} onChange={(e) => setLa(e.target.value)} className={`${inputCls} w-16`} />
                    <span className="text-xs text-muted-foreground">B =</span>
                    <Input type="number" value={lb} onChange={(e) => setLb(e.target.value)} className={`${inputCls} w-16`} />
                    <span className="text-xs text-muted-foreground">C =</span>
                    <Input type="number" value={lc} onChange={(e) => setLc(e.target.value)} className={`${inputCls} w-16`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Circle ── */}
          {mode === 'circle' && (
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <CardContent className="p-4 space-y-4">
                {/* Sub-mode toggle */}
                <div className="flex gap-1.5 p-1 bg-muted/60 rounded-lg">
                  <button
                    onClick={() => setCircleMode('center')}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-md transition-all ${
                      circleMode === 'center'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Center + Radius
                  </button>
                  <button
                    onClick={() => setCircleMode('threePoints')}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-md transition-all ${
                      circleMode === 'threePoints'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    3 Points
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={circleMode}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="space-y-4"
                  >
                    {circleMode === 'center' ? (
                      <>
                        <PointInput label="Center (h, k)" x={ch} y={ck} onX={setCh} onY={setCk} />
                        <div className="space-y-1.5">
                          <p className={labelCls}>Radius (r)</p>
                          <Input
                            type="number"
                            value={cr}
                            onChange={(e) => setCr(e.target.value)}
                            className={inputCls}
                            placeholder="5"
                            aria-label="Radius"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <PointInput label="Point 1 (x₁, y₁)" x={cx1} y={cy1} onX={setCx1} onY={setCy1} />
                        <PointInput label="Point 2 (x₂, y₂)" x={cx2} y={cy2} onX={setCx2} onY={setCy2} />
                        <PointInput label="Point 3 (x₃, y₃)" x={cx3} y={cy3} onX={setCx3} onY={setCy3} />
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          )}

          {/* ── Triangle Area ── */}
          {mode === 'triangle' && (
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <PointInput label="Vertex A (x₁, y₁)" x={tx1} y={ty1} onX={setTx1} onY={setTy1} />
                <PointInput label="Vertex B (x₂, y₂)" x={tx2} y={ty2} onX={setTx2} onY={setTy2} />
                <PointInput label="Vertex C (x₃, y₃)" x={tx3} y={ty3} onX={setTx3} onY={setTy3} />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence mode="wait">
        {result.rows.length > 0 && (
          <motion.div
            key={`result-${mode}-${circleMode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <ResultCard
              title="Result"
              rows={result.rows}
              latex={result.latex}
              KaTeXRenderer={KaTeXRenderer}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}