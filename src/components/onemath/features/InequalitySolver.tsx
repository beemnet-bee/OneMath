'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import KaTeXRenderer from '@/components/onemath/KaTeXRenderer';
import ResultCard from '@/components/onemath/ResultCard';

/* ═══════════════════ Types ═══════════════════ */

type InequalityOp = '>' | '<' | '>=' | '<=';

interface SolveStep {
  label: string;
  latex: string;
  type: 'original' | 'step' | 'solution' | 'info';
}

interface SolutionInterval {
  left: number | null;
  right: number | null;
  leftOpen: boolean;
  rightOpen: boolean;
}

interface InequalityResult {
  intervals: SolutionInterval[];
  intervalNotation: string;
  steps: SolveStep[];
  inequType: string;
}

/* ═══════════════════ Constants ═══════════════════ */

const INEQ_OPS: InequalityOp[] = ['>=', '<=', '>', '<'];

const INEQ_LATEX: Record<InequalityOp, string> = {
  '>': '>', '<': '<', '>=': '\\geq', '<=': '\\leq',
};

const INEQ_FLIP: Record<InequalityOp, InequalityOp> = {
  '>': '<', '<': '>', '>=': '<=', '<=': '>=',
};

const examples = [
  '2x + 3 > 7',
  '-3x + 2 >= 8',
  '5x - 1 <= 14',
  'x^2 - 5x + 6 > 0',
  'x^2 + 2x + 1 <= 0',
  '|x - 3| < 5',
  '|2x + 1| >= 7',
  '-1 < 3x - 4 < 8',
];

/* ═══════════════════ Helpers ═══════════════════ */

function fmt(n: number): string {
  if (Number.isInteger(n)) return `${n}`;
  return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function exprLatex(e: string): string {
  return e.replace(/²/g, '^2').replace(/\*/g, ' \\cdot ');
}

function parseLinearSide(expr: string): { coeff: number; constant: number } {
  const s = expr.replace(/\s+/g, '').replace(/-/g, '+-');
  const parts = s.split('+').filter(Boolean);
  let coeff = 0;
  let constant = 0;
  for (const p of parts) {
    if (p.includes('x')) {
      const c = p.replace('x', '');
      coeff += c === '' || c === '+' ? 1 : c === '-' ? -1 : parseFloat(c);
    } else {
      constant += parseFloat(p) || 0;
    }
  }
  return { coeff, constant };
}

function parseQuadCoeffs(expr: string): { a: number; b: number; c: number } {
  let s = expr.replace(/\s+/g, '').replace(/x\s*²/g, 'x^2').replace(/x²/g, 'x^2');
  s = s.replace(/-/g, '+-');
  const parts = s.split('+').filter(Boolean);
  let a = 0, b = 0, c = 0;
  for (const p of parts) {
    if (p.includes('x^2')) {
      const v = p.replace('x^2', '');
      a += v === '' || v === '+' ? 1 : v === '-' ? -1 : parseFloat(v);
    } else if (p.includes('x')) {
      const v = p.replace('x', '');
      b += v === '' || v === '+' ? 1 : v === '-' ? -1 : parseFloat(v);
    } else {
      c += parseFloat(p) || 0;
    }
  }
  return { a, b, c };
}

function findOps(input: string): { op: InequalityOp; start: number; end: number }[] {
  const results: { op: InequalityOp; start: number; end: number }[] = [];
  let pos = 0;
  while (pos < input.length) {
    let found = false;
    for (const op of INEQ_OPS) {
      if (input.substring(pos).startsWith(op)) {
        results.push({ op, start: pos, end: pos + op.length });
        pos += op.length;
        found = true;
        break;
      }
    }
    if (!found) pos++;
  }
  return results;
}

function ivNotation(ivs: SolutionInterval[]): string {
  if (ivs.length === 0) return '\\emptyset';
  return ivs
    .map((iv) => {
      const l = iv.left === null ? '-\\infty' : fmt(iv.left);
      const r = iv.right === null ? '\\infty' : fmt(iv.right);
      const lb = iv.left === null || iv.leftOpen ? '(' : '[';
      const rb = iv.right === null || iv.rightOpen ? ')' : ']';
      return `${lb}${l},\\;${r}${rb}`;
    })
    .join(' \\cup ');
}

const ALL_INTERVAL: SolutionInterval = { left: null, right: null, leftOpen: false, rightOpen: false };
const ALL_NOTATION = '(-\\infty,\\;\\infty)';
const EMPTY_RESULT = (inequType: string): InequalityResult => ({
  intervals: [],
  intervalNotation: '\\emptyset',
  steps: [{ label: 'Solution', latex: '\\text{No solution}', type: 'info' }],
  inequType,
});
const ALL_RESULT = (steps: SolveStep[], inequType: string): InequalityResult => ({
  intervals: [ALL_INTERVAL],
  intervalNotation: ALL_NOTATION,
  steps,
  inequType,
});
const ERR_RESULT = (inequType: string): InequalityResult => ({
  intervals: [],
  intervalNotation: '\\emptyset',
  steps: [{ label: 'Error', latex: '\\text{Could not parse the inequality}', type: 'info' }],
  inequType,
});

/* ═══════════════════ Solvers ═══════════════════ */

function solveLinear(input: string): InequalityResult {
  const steps: SolveStep[] = [];
  const ops = findOps(input);
  if (ops.length !== 1) return ERR_RESULT('Linear');

  const { op, start, end } = ops[0];
  const leftStr = input.slice(0, start).trim();
  const rightStr = input.slice(end).trim();

  steps.push({ label: 'Original', latex: `${exprLatex(leftStr)} ${INEQ_LATEX[op]} ${exprLatex(rightStr)}`, type: 'original' });

  const L = parseLinearSide(leftStr);
  const R = parseLinearSide(rightStr);
  const nc = L.coeff - R.coeff;
  const nv = R.constant - L.constant;

  if (nc === 0) {
    const alwaysTrue =
      (op === '>' || op === '>=') ? nv >= 0 : nv <= 0;
    steps.push({ label: 'Simplify', latex: `0 ${INEQ_LATEX[op]} ${fmt(nv)}`, type: 'step' });
    if (alwaysTrue) {
      steps.push({ label: 'Solution', latex: '\\text{Always true — all real numbers}', type: 'solution' });
      return ALL_RESULT(steps, 'Linear');
    }
    return EMPTY_RESULT('Linear');
  }

  const cLatex = nc === 1 ? 'x' : nc === -1 ? '-x' : `${fmt(nc)}x`;
  steps.push({ label: 'Simplify', latex: `${cLatex} ${INEQ_LATEX[op]} ${fmt(nv)}`, type: 'step' });

  let effOp = op;
  if (nc < 0) {
    effOp = INEQ_FLIP[op];
    steps.push({ label: 'Divide by ' + fmt(nc), latex: `\\div\\;${fmt(nc)} \\;\\Rightarrow\\; \\text{flip sign}`, type: 'step' });
  }

  const sol = nv / nc;
  steps.push({ label: 'Solution', latex: `x ${INEQ_LATEX[effOp]} ${fmt(sol)}`, type: 'solution' });

  const strict = effOp === '>' || effOp === '<';
  let intervals: SolutionInterval[];
  let notation: string;
  if (effOp === '>' || effOp === '>=') {
    intervals = [{ left: sol, right: null, leftOpen: strict, rightOpen: true }];
    notation = `${strict ? '(' : '['}${fmt(sol)},\\;\\infty)`;
  } else {
    intervals = [{ left: null, right: sol, leftOpen: true, rightOpen: strict }];
    notation = `(-\\infty,\\;${fmt(sol)}${strict ? ')' : ']'}`;
  }
  steps.push({ label: 'Interval Notation', latex: notation, type: 'info' });
  return { intervals, intervalNotation: notation, steps, inequType: 'Linear' };
}

function solveQuadratic(input: string): InequalityResult {
  const steps: SolveStep[] = [];
  const ops = findOps(input);
  if (ops.length !== 1) return ERR_RESULT('Quadratic');

  const { op, start, end } = ops[0];
  const leftStr = input.slice(0, start).trim();
  const rightStr = input.slice(end).trim();

  steps.push({ label: 'Original', latex: `${exprLatex(leftStr)} ${INEQ_LATEX[op]} ${exprLatex(rightStr)}`, type: 'original' });

  const { a, b, c: lc } = parseQuadCoeffs(leftStr);
  const rc = parseLinearSide(rightStr).constant;
  const c = lc - rc;

  if (a === 0) return solveLinear(input);

  const signC = c >= 0 ? `+ ${fmt(c)}` : `- ${fmt(Math.abs(c))}`;
  const signB = b >= 0 ? `+ ${fmt(b)}` : `- ${fmt(Math.abs(b))}`;
  steps.push({ label: 'Standard Form', latex: `${fmt(a)}x^2 ${signB}x ${signC} ${INEQ_LATEX[op]} 0`, type: 'step' });

  const D = b * b - 4 * a * c;
  steps.push({ label: 'Discriminant', latex: `\\Delta = (${fmt(b)})^2 - 4(${fmt(a)})(${fmt(c)}) = ${fmt(D)}`, type: 'step' });

  if (D < 0) {
    const posEverywhere = a > 0;
    const match =
      (posEverywhere && (op === '>' || op === '>=')) ||
      (!posEverywhere && (op === '<' || op === '<='));
    steps.push({ label: 'Analysis', latex: (posEverywhere ? 'a > 0,\\; \\Delta < 0 \\Rightarrow \\text{always positive}' : 'a < 0,\\; \\Delta < 0 \\Rightarrow \\text{always negative}'), type: 'step' });
    if (match) {
      steps.push({ label: 'Solution', latex: '\\text{All real numbers}', type: 'solution' });
      return ALL_RESULT(steps, 'Quadratic');
    }
    return EMPTY_RESULT('Quadratic');
  }

  const sqrtD = Math.sqrt(D);
  const r1 = (-b - sqrtD) / (2 * a);
  const r2 = (-b + sqrtD) / (2 * a);
  const lo = Math.min(r1, r2);
  const hi = Math.max(r1, r2);

  if (Math.abs(D) < 1e-10) {
    steps.push({ label: 'Root', latex: `x = \\frac{${fmt(-b)}}{${fmt(2 * a)}} = ${fmt(lo)}`, type: 'step' });
    const posOrZero = a > 0;
    if (posOrZero && (op === '>=' || op === '<=')) {
      steps.push({ label: 'Solution', latex: '\\text{All real numbers}', type: 'solution' });
      return ALL_RESULT(steps, 'Quadratic');
    }
    if (!posOrZero && (op === '>' || op === '<')) {
      steps.push({ label: 'Solution', latex: '\\text{No solution}', type: 'info' });
      return EMPTY_RESULT('Quadratic');
    }
    if (posOrZero && op === '>') {
      steps.push({ label: 'Solution', latex: `x \\neq ${fmt(lo)}`, type: 'solution' });
      const n = `(-\\infty,\\;${fmt(lo)}) \\cup (${fmt(lo)},\\;\\infty)`;
      return { intervals: [{ left: null, right: lo, leftOpen: true, rightOpen: true }, { left: lo, right: null, leftOpen: true, rightOpen: true }], intervalNotation: n, steps, inequType: 'Quadratic' };
    }
    if (!posOrZero && op === '<=') {
      steps.push({ label: 'Solution', latex: `x \\neq ${fmt(lo)}`, type: 'solution' });
      const n = `(-\\infty,\\;${fmt(lo)}) \\cup (${fmt(lo)},\\;\\infty)`;
      return { intervals: [{ left: null, right: lo, leftOpen: true, rightOpen: true }, { left: lo, right: null, leftOpen: true, rightOpen: true }], intervalNotation: n, steps, inequType: 'Quadratic' };
    }
    steps.push({ label: 'Solution', latex: `x = ${fmt(lo)}`, type: 'solution' });
    return { intervals: [{ left: lo, right: lo, leftOpen: false, rightOpen: false }], intervalNotation: `\\{${fmt(lo)}\\}`, steps, inequType: 'Quadratic' };
  }

  steps.push({ label: 'Roots', latex: `x_1 = ${fmt(lo)},\\; x_2 = ${fmt(hi)}`, type: 'step' });

  const wantAbove = op === '>' || op === '>=';
  const positiveOutside = a > 0;
  const outside = wantAbove === positiveOutside;
  const strict = op === '>' || op === '<';

  if (outside) {
    steps.push({ label: 'Analysis', latex: (positiveOutside ? 'a > 0,\\; \\text{opens up — positive outside roots}' : 'a < 0,\\; \\text{opens down — negative outside roots}'), type: 'step' });
    const leftOpL = wantAbove ? '<' : '>';
    const rightOpL = wantAbove ? '>' : '<';

    if (!strict) {
      const leq = wantAbove ? '\\leq' : '\\geq';
      const geq = wantAbove ? '\\geq' : '\\leq';
      steps.push({ label: 'Solution', latex: `x ${leq} ${fmt(lo)} \\;\\text{or}\\; x ${geq} ${fmt(hi)}`, type: 'solution' });
    } else {
      steps.push({ label: 'Solution', latex: `x ${leftOpL} ${fmt(lo)} \\;\\text{or}\\; x ${rightOpL} ${fmt(hi)}`, type: 'solution' });
    }
    const intervals: SolutionInterval[] = [
      { left: null, right: lo, leftOpen: true, rightOpen: strict },
      { left: hi, right: null, leftOpen: strict, rightOpen: true },
    ];
    const lb = strict ? ')' : ']';
    const rb = strict ? '(' : '[';
    const n = `(-\\infty,\\;${fmt(lo)}${lb}) \\cup (${rb}${fmt(hi)},\\;\\infty)`;
    steps.push({ label: 'Interval Notation', latex: n, type: 'info' });
    return { intervals, intervalNotation: n, steps, inequType: 'Quadratic' };
  }

  steps.push({ label: 'Analysis', latex: (positiveOutside ? 'a > 0,\\; \\text{opens up — negative between roots}' : 'a < 0,\\; \\text{opens down — positive between roots}'), type: 'step' });
  const loL = strict ? '>' : '\\geq';
  const hiL = strict ? '<' : '\\leq';
  steps.push({ label: 'Solution', latex: `${fmt(lo)} ${loL} x ${hiL} ${fmt(hi)}`, type: 'solution' });
  const intervals: SolutionInterval[] = [{ left: lo, right: hi, leftOpen: strict, rightOpen: strict }];
  const lb = strict ? '(' : '[';
  const rb = strict ? ')' : ']';
  const n = `${lb}${fmt(lo)},\\;${fmt(hi)}${rb}`;
  steps.push({ label: 'Interval Notation', latex: n, type: 'info' });
  return { intervals, intervalNotation: n, steps, inequType: 'Quadratic' };
}

function solveAbsoluteValue(input: string): InequalityResult {
  const steps: SolveStep[] = [];
  const match = input.match(/\|(.+?)\|\s*(>=|<=|>|<)\s*(-?[\d.]+)/);
  if (!match) return ERR_RESULT('Absolute Value');

  const inner = match[1].trim();
  const op = match[2] as InequalityOp;
  const rv = parseFloat(match[3]);

  steps.push({ label: 'Original', latex: `|${exprLatex(inner)}| ${INEQ_LATEX[op]} ${fmt(rv)}`, type: 'original' });

  if (rv < 0) {
    if (op === '>' || op === '>=') {
      steps.push({ label: 'Analysis', latex: `|\\cdot| \\geq 0 \\text{ and } ${fmt(rv)} < 0`, type: 'step' });
      steps.push({ label: 'Solution', latex: '\\text{All real numbers}', type: 'solution' });
      return ALL_RESULT(steps, 'Absolute Value');
    }
    steps.push({ label: 'Analysis', latex: `|\\cdot| \\geq 0,\\; \\text{cannot be } ${INEQ_LATEX[op]}\\; ${fmt(rv)} < 0`, type: 'step' });
    return EMPTY_RESULT('Absolute Value');
  }

  const parsed = parseLinearSide(inner);
  const strict = op === '<' || op === '>';

  if (op === '<' || op === '<=') {
    const compOp = strict ? '<' : '\\leq';
    steps.push({ label: 'Rewrite', latex: `-${fmt(rv)} ${compOp} ${exprLatex(inner)} ${compOp} ${fmt(rv)}`, type: 'step' });

    if (parsed.coeff === 0) {
      const ok = strict ? Math.abs(parsed.constant) < rv : Math.abs(parsed.constant) <= rv;
      if (ok) { steps.push({ label: 'Solution', latex: '\\text{All real numbers}', type: 'solution' }); return ALL_RESULT(steps, 'Absolute Value'); }
      return EMPTY_RESULT('Absolute Value');
    }

    const lo = (-rv - parsed.constant) / parsed.coeff;
    const hi = (rv - parsed.constant) / parsed.coeff;
    const loVal = Math.min(lo, hi);
    const hiVal = Math.max(lo, hi);

    steps.push({ label: 'Solve', latex: `${fmt(loVal)} ${compOp} x ${compOp} ${fmt(hiVal)}`, type: 'step' });
    steps.push({ label: 'Solution', latex: `${fmt(loVal)} ${compOp} x ${compOp} ${fmt(hiVal)}`, type: 'solution' });
    const lb = strict ? '(' : '[';
    const rb = strict ? ')' : ']';
    const n = `${lb}${fmt(loVal)},\\;${fmt(hiVal)}${rb}`;
    steps.push({ label: 'Interval Notation', latex: n, type: 'info' });
    return { intervals: [{ left: loVal, right: hiVal, leftOpen: strict, rightOpen: strict }], intervalNotation: n, steps, inequType: 'Absolute Value' };
  }

  // op is > or >=
  const outsideOp = strict ? '>' : '\\geq';
  const insideOp = strict ? '<' : '\\leq';
  steps.push({ label: 'Rewrite', latex: `${exprLatex(inner)} ${insideOp} -${fmt(rv)} \\;\\text{or}\\; ${exprLatex(inner)} ${outsideOp} ${fmt(rv)}`, type: 'step' });

  if (parsed.coeff === 0) {
    const ok = strict ? Math.abs(parsed.constant) > rv : Math.abs(parsed.constant) >= rv;
    if (ok) { steps.push({ label: 'Solution', latex: '\\text{All real numbers}', type: 'solution' }); return ALL_RESULT(steps, 'Absolute Value'); }
    return EMPTY_RESULT('Absolute Value');
  }

  const b1 = (-rv - parsed.constant) / parsed.coeff;
  const b2 = (rv - parsed.constant) / parsed.coeff;
  const leftB = Math.min(b1, b2);
  const rightB = Math.max(b1, b2);

  steps.push({ label: 'Solve', latex: `x ${insideOp} ${fmt(leftB)} \\;\\text{or}\\; x ${outsideOp} ${fmt(rightB)}`, type: 'step' });
  steps.push({ label: 'Solution', latex: `x ${insideOp} ${fmt(leftB)} \\;\\text{or}\\; x ${outsideOp} ${fmt(rightB)}`, type: 'solution' });
  const lb = strict ? ')' : ']';
  const rb = strict ? '(' : '[';
  const n = `(-\\infty,\\;${fmt(leftB)}${lb}) \\cup (${rb}${fmt(rightB)},\\;\\infty)`;
  steps.push({ label: 'Interval Notation', latex: n, type: 'info' });
  return {
    intervals: [
      { left: null, right: leftB, leftOpen: true, rightOpen: strict },
      { left: rightB, right: null, leftOpen: strict, rightOpen: true },
    ],
    intervalNotation: n,
    steps,
    inequType: 'Absolute Value',
  };
}

function solveCompound(input: string): InequalityResult {
  const steps: SolveStep[] = [];
  const ops = findOps(input);
  if (ops.length < 2) return ERR_RESULT('Compound');

  const { op: op1, start: s1, end: e1 } = ops[0];
  const { op: op2, start: s2, end: e2 } = ops[1];
  const leftStr = input.slice(0, s1).trim();
  const midStr = input.slice(e1, s2).trim();
  const rightStr = input.slice(e2).trim();

  steps.push({ label: 'Original', latex: `${exprLatex(leftStr)} ${INEQ_LATEX[op1]} ${exprLatex(midStr)} ${INEQ_LATEX[op2]} ${exprLatex(rightStr)}`, type: 'original' });

  const leftVal = parseFloat(leftStr);
  const rightVal = parseFloat(rightStr);
  const mid = parseLinearSide(midStr);

  if (isNaN(leftVal) || isNaN(rightVal) || mid.coeff === 0) return ERR_RESULT('Compound');

  steps.push({ label: 'Split', latex: `${fmt(leftVal)} ${INEQ_LATEX[op1]} ${exprLatex(midStr)} \\quad\\text{and}\\quad ${exprLatex(midStr)} ${INEQ_LATEX[op2]} ${fmt(rightVal)}`, type: 'step' });

  const lo = (leftVal - mid.constant) / mid.coeff;
  const hi = (rightVal - mid.constant) / mid.coeff;
  const opLo: InequalityOp = mid.coeff > 0 ? op1 : INEQ_FLIP[op1];
  const opHi: InequalityOp = mid.coeff > 0 ? op2 : INEQ_FLIP[op2];

  const loVal = Math.min(lo, hi);
  const hiVal = Math.max(lo, hi);
  const loOp = loVal === lo ? opLo : opHi;
  const hiOp = loVal === lo ? opHi : opLo;

  steps.push({ label: 'Solve', latex: `${fmt(loVal)} ${INEQ_LATEX[loOp]} x ${INEQ_LATEX[hiOp]} ${fmt(hiVal)}`, type: 'step' });
  steps.push({ label: 'Solution', latex: `${fmt(loVal)} ${INEQ_LATEX[loOp]} x ${INEQ_LATEX[hiOp]} ${fmt(hiVal)}`, type: 'solution' });

  const loOpen = loOp === '>';
  const hiOpen = hiOp === '<';
  const lb = loOpen ? '(' : '[';
  const rb = hiOpen ? ')' : ']';
  const n = `${lb}${fmt(loVal)},\\;${fmt(hiVal)}${rb}`;
  steps.push({ label: 'Interval Notation', latex: n, type: 'info' });
  return { intervals: [{ left: loVal, right: hiVal, leftOpen: loOpen, rightOpen: hiOpen }], intervalNotation: n, steps, inequType: 'Compound' };
}

function solveInequality(input: string): InequalityResult {
  const s = input.trim();
  if (!s) return ERR_RESULT('Unknown');

  if (s.includes('|')) return solveAbsoluteValue(s);

  const ops = findOps(s);
  if (ops.length >= 2) return solveCompound(s);

  const normalized = s.replace(/\s+/g, '');
  if (/x[²\^]2|x\^2/.test(normalized)) return solveQuadratic(s);

  return solveLinear(s);
}

/* ═══════════════════ Number Line ═══════════════════ */

function NumberLine({ intervals }: { intervals: SolutionInterval[] }) {
  if (intervals.length === 0) return null;

  const allFinite = intervals.flatMap((iv) => [iv.left, iv.right].filter((v): v is number => v !== null));
  let viewMin: number, viewMax: number;

  if (allFinite.length === 0) {
    viewMin = -5;
    viewMax = 5;
  } else {
    const dMin = Math.min(...allFinite);
    const dMax = Math.max(...allFinite);
    const pad = Math.max((dMax - dMin) * 0.35, 2);
    viewMin = dMin - pad;
    viewMax = dMax + pad;
    if (viewMax - viewMin < 4) {
      const c = (viewMin + viewMax) / 2;
      viewMin = c - 2;
      viewMax = c + 2;
    }
  }

  const mapX = (v: number) => 20 + ((v - viewMin) / (viewMax - viewMin)) * 360;

  const tickMin = Math.ceil(viewMin);
  const tickMax = Math.floor(viewMax);
  const ticks: number[] = [];
  for (let t = tickMin; t <= tickMax; t++) ticks.push(t);

  const isAll = intervals.length === 1 && intervals[0].left === null && intervals[0].right === null;
  const isSinglePoint = intervals.length === 1 && intervals[0].left !== null && intervals[0].right !== null && Math.abs(intervals[0].left - intervals[0].right) < 1e-10;

  return (
    <svg viewBox="0 0 400 80" className="w-full" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>
      {/* Shaded regions */}
      {intervals.map((iv, i) => {
        if (isSinglePoint) return null;
        const lx = iv.left === null ? 18 : mapX(iv.left);
        const rx = iv.right === null ? 382 : mapX(iv.right);
        return (
          <rect key={i} x={lx} y={36} width={Math.max(rx - lx, 0)} height={8} fill="#10b981" opacity={0.2} rx={4} />
        );
      })}
      {isAll && <rect x={18} y={36} width={364} height={8} fill="#10b981" opacity={0.2} rx={4} />}

      {/* Axis */}
      <line x1="18" y1="40" x2="380" y2="40" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="378,35 388,40 378,45" fill="currentColor" />

      {/* Ticks */}
      {ticks.map((t) => (
        <line key={t} x1={mapX(t)} y1="37" x2={mapX(t)} y2="43" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      ))}

      {/* Bound markers */}
      {intervals.map((iv, i) => {
        const markers: React.ReactNode[] = [];
        if (iv.left !== null) {
          const isSingle = isSinglePoint && i === 0;
          markers.push(
            <g key={`l${i}`}>
              <circle cx={mapX(iv.left)} cy={40} r={5} fill={isSingle || !iv.leftOpen ? '#10b981' : 'none'} stroke="#10b981" strokeWidth={2} />
              <text x={mapX(iv.left)} y="62" textAnchor="middle" className="text-[10px]" fill="currentColor" style={{ fontFamily: "'Latin Modern Math', serif" }}>
                {fmt(iv.left)}
              </text>
            </g>,
          );
        }
        if (iv.right !== null && !isSinglePoint) {
          markers.push(
            <g key={`r${i}`}>
              <circle cx={mapX(iv.right)} cy={40} r={5} fill={!iv.rightOpen ? '#10b981' : 'none'} stroke="#10b981" strokeWidth={2} />
              <text x={mapX(iv.right)} y="62" textAnchor="middle" className="text-[10px]" fill="currentColor" style={{ fontFamily: "'Latin Modern Math', serif" }}>
                {fmt(iv.right)}
              </text>
            </g>,
          );
        }
        return markers;
      })}
    </svg>
  );
}

/* ═══════════════════ Main Component ═══════════════════ */

export default function InequalitySolver() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<InequalityResult | null>(null);
  const [error, setError] = useState('');

  const solve = useCallback(() => {
    if (!input.trim()) return;
    try {
      const r = solveInequality(input);
      setResult(r);
      setError('');
    } catch {
      setError('Could not parse the inequality. Check your format.');
      setResult(null);
    }
  }, [input]);

  const reset = () => {
    setInput('');
    setResult(null);
    setError('');
  };

  const fillExample = (ex: string) => {
    setInput(ex);
    setResult(null);
    setError('');
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="≠"
        title="Inequality Solver"
        description="Solve linear, quadratic, absolute value & compound inequalities"
        gradient="from-emerald-500 to-teal-600"
      />

      {/* Input Card */}
      <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">
              Enter Inequality
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              Linear · Quadratic · Absolute · Compound
            </span>
          </div>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') solve(); }}
            placeholder='e.g. 2x + 3 > 7, x^2 - 5x + 6 > 0, |x-3| < 5'
            className="h-11 rounded-xl bg-muted/60 border-border text-sm text-foreground focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 dark:bg-muted/40"
            style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
          />

          <div className="flex items-center gap-2">
            <Button
              onClick={solve}
              disabled={!input.trim()}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-10 shadow-sm"
            >
              <Play className="w-4 h-4 mr-2" /> Solve
            </Button>
            {(input || result) && (
              <Button variant="ghost" size="icon" onClick={reset} className="h-10 w-10 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 px-4 py-3 rounded-xl border border-red-200/60 dark:border-red-800/40"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Interval Notation Summary */}
            <ResultCard
              title={`${result.inequType} Inequality — Solution`}
              rows={[
                { label: 'Type', value: result.inequType },
                {
                  label: 'Interval',
                  value: result.intervals.length === 0 ? 'No solution' : result.intervalNotation.replace(/\\/g, ''),
                  highlight: true,
                },
              ]}
              KaTeXRenderer={KaTeXRenderer}
              latex={[result.intervalNotation]}
            />

            {/* Number Line */}
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
                  Number Line
                </p>
                {result.intervals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No solution — nothing to shade</p>
                ) : (
                  <NumberLine intervals={result.intervals} />
                )}
              </CardContent>
            </Card>

            {/* Step-by-Step */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                Step-by-Step Solution
              </p>

              {result.steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                >
                  <Card
                    className={`overflow-hidden transition-colors ${
                      step.type === 'solution'
                        ? 'border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : step.type === 'info'
                        ? 'border-red-200/60 dark:border-red-800/40 bg-red-50/30 dark:bg-red-950/10'
                        : step.type === 'original'
                        ? 'border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/10'
                        : 'border-border'
                    }`}
                  >
                    <CardContent className="p-3.5 flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          step.type === 'solution'
                            ? 'bg-emerald-500 text-white'
                            : step.type === 'info'
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                            : step.type === 'original'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step.type === 'solution' ? '✓' : step.type === 'info' ? '!' : i + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                            step.type === 'solution'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : step.type === 'info'
                              ? 'text-red-500'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {step.label}
                        </p>
                        <div
                          className="overflow-x-auto"
                          style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                        >
                          <KaTeXRenderer
                            latex={step.latex}
                            className={`text-base ${
                              step.type === 'solution'
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : step.type === 'info'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-foreground'
                            }`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Examples */}
      {!result && !error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">Try an example:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => fillExample(ex)}
                className="text-xs px-3 py-1.5 bg-card border border-border rounded-full hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all text-foreground hover:shadow-sm"
              >
                {ex}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Supported Formats</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-emerald-500 shrink-0" />
              <span><strong>Linear:</strong> 2x + 3 {'>'} 7, -3x + 2 {'>='} 8</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-emerald-500 shrink-0" />
              <span><strong>Quadratic:</strong> x^2 - 5x + 6 {'>'} 0, x^2 + 2x + 1 {'<='} 0</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-emerald-500 shrink-0" />
              <span><strong>Absolute Value:</strong> |x - 3| {'<'} 5, |2x + 1| {'>='} 7</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-emerald-500 shrink-0" />
              <span><strong>Compound:</strong> 2 {'<'} x + 1 {'<'} 5, -3 {'<='} 2x {'<'} 10</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}