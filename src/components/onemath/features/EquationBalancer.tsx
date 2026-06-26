'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import KaTeXRenderer from '@/components/onemath/KaTeXRenderer';

/* ──────────────── Types ──────────────── */

interface SolveStep {
  label: string;
  latex: string;
  type: 'original' | 'step' | 'solution' | 'error';
}

interface SystemSolution {
  x: number;
  y: number;
  steps: SolveStep[];
}

/* ──────────────── Equation Parser ──────────────── */

function parseTerms(expr: string): { coeffs: Record<string, number>; constant: number } {
  const cleaned = expr.replace(/\s+/g, '').replace(/-/g, '+-');
  const parts = cleaned.split('+').filter(Boolean);
  const coeffs: Record<string, number> = {};
  let constant = 0;

  for (const part of parts) {
    const varMatch = part.match(/^(-?\d*)([a-zA-Z]+)$/);
    if (varMatch) {
      const coeff = varMatch[1] === '' || varMatch[1] === '+' ? 1 : varMatch[1] === '-' ? -1 : parseFloat(varMatch[1]);
      const variable = varMatch[2];
      coeffs[variable] = (coeffs[variable] || 0) + coeff;
    } else {
      constant += parseFloat(part) || 0;
    }
  }

  return { coeffs, constant };
}

function expandExpression(expr: string): string {
  // Handle a(b+c) -> a*b + a*c and a(b-c) -> a*b - a*c
  let result = expr;
  const expandRegex = /(-?\d*\.?\d*)\(([^)]+)\)/g;
  let safety = 0;
  while (expandRegex.test(result) && safety < 10) {
    safety++;
    result = result.replace(expandRegex, (_, coeffStr, inner: string) => {
      const coeff = coeffStr === '' || coeffStr === '+' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
      const terms = inner.replace(/\s+/g, '').replace(/-/g, '+-').split('+').filter(Boolean);
      const expanded = terms.map(t => {
        if (t.includes('x') || t.includes('y')) {
          const vm = t.match(/^(-?\d*)([xy])$/);
          if (vm) {
            const vc = vm[1] === '' || vm[1] === '+' ? 1 : vm[1] === '-' ? -1 : parseFloat(vm[1]);
            return `${coeff * vc}${vm[2]}`;
          }
          return `${coeff}*${t}`;
        }
        return `${coeff * (parseFloat(t) || 0)}`;
      });
      return expanded.join('+').replace(/\+-/g, '-').replace(/\+\+/g, '+');
    });
  }
  return result;
}

function termsToLatex(terms: Record<string, number>, constant: number, sign = '+'): string {
  const parts: string[] = [];
  const varEntries = Object.entries(terms);
  for (const [variable, coeff] of varEntries) {
    if (coeff === 0) continue;
    if (parts.length === 0) {
      parts.push(coeff === 1 ? `${variable}` : coeff === -1 ? `-${variable}` : `${coeff}${variable}`);
    } else {
      parts.push(coeff > 0 ? `+ ${coeff === 1 ? '' : coeff}${variable}` : `- ${coeff === -1 ? '' : Math.abs(coeff)}${variable}`);
    }
  }
  if (constant !== 0) {
    if (parts.length === 0) {
      parts.push(`${constant}`);
    } else {
      parts.push(constant > 0 ? `+ ${constant}` : `- ${Math.abs(constant)}`);
    }
  }
  return parts.join(' ') || '0';
}

function toLatex(expr: string): string {
  return expr
    .replace(/\*/g, ' \\cdot ')
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/pi/g, '\\pi');
}

/* ──────────────── Single Equation Solver ──────────────── */

function solveSingleEquation(input: string): SolveStep[] {
  const steps: SolveStep[] = [];
  const eqParts = input.split('=');

  if (eqParts.length !== 2) {
    steps.push({ label: 'Error', latex: 'Invalid equation format. Use "=" to separate sides.', type: 'error' });
    return steps;
  }

  const [leftStr, rightStr] = eqParts;
  const originalLatex = `${toLatex(leftStr)} = ${toLatex(rightStr)}`;
  steps.push({ label: 'Original', latex: originalLatex, type: 'original' });

  // Check for parentheses and expand
  const hasParens = leftStr.includes('(') || rightStr.includes('(');
  let leftParsed: { coeffs: Record<string, number>; constant: number };
  let rightParsed: { coeffs: Record<string, number>; constant: number };
  if (hasParens) {
    const expandedLeft = expandExpression(leftStr);
    const expandedRight = expandExpression(rightStr);
    const expLatex = `${toLatex(expandedLeft)} = ${toLatex(expandedRight)}`;
    if (expLatex !== originalLatex) {
      steps.push({ label: 'Expand', latex: expLatex, type: 'step' });
    }
    leftParsed = parseTerms(expandedLeft);
    rightParsed = parseTerms(expandedRight);
  } else {
    leftParsed = parseTerms(leftStr);
    rightParsed = parseTerms(rightStr);
  }

  // Move all variable terms to left, constants to right
  const allVars = new Set([...Object.keys(leftParsed.coeffs), ...Object.keys(rightParsed.coeffs)]);
  const varNames = Array.from(allVars);

  if (varNames.length > 2) {
    steps.push({ label: 'Error', latex: 'Only 1 or 2 variable equations are supported.', type: 'error' });
    return steps;
  }

  if (varNames.length === 0) {
    const leftVal = leftParsed.constant;
    const rightVal = rightParsed.constant;
    if (Math.abs(leftVal - rightVal) < 1e-10) {
      steps.push({ label: 'Solution', latex: '\\text{Identity: always true}', type: 'solution' });
    } else {
      steps.push({ label: 'Solution', latex: '\\text{Contradiction: no solution}', type: 'error' });
    }
    return steps;
  }

  if (varNames.length === 1) {
    const v = varNames[0];
    const leftCoeff = leftParsed.coeffs[v] || 0;
    const rightCoeff = rightParsed.coeffs[v] || 0;
    const leftConst = leftParsed.constant;
    const rightConst = rightParsed.constant;

    const newLeftCoeff = leftCoeff - rightCoeff;
    const newRightConst = rightConst - leftConst;

    if (newLeftCoeff === 0) {
      if (Math.abs(newRightConst) < 1e-10) {
        steps.push({ label: 'Solution', latex: '\\text{Infinite solutions (identity)}', type: 'solution' });
      } else {
        steps.push({ label: 'Solution', latex: '\\text{No solution (contradiction)}', type: 'error' });
      }
      return steps;
    }

    // Show moving terms
    const moveStep = termsToLatex({ [v]: newLeftCoeff }, 0) + ' = ' + `${newRightConst}`;
    steps.push({ label: 'Rearrange', latex: toLatex(moveStep), type: 'step' });

    const solution = newRightConst / newLeftCoeff;
    const solLatex = `${v} = ${Number.isInteger(solution) ? solution : solution.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`;
    steps.push({ label: 'Solution', latex: solLatex, type: 'solution' });
  }

  return steps;
}

/* ──────────────── System Solver ──────────────── */

function solveSystem(eqn1: string, eqn2: string): SolveStep[] {
  const steps: SolveStep[] = [];

  steps.push({ label: 'System', latex: `\\begin{cases} ${toLatex(eqn1)} \\\\ ${toLatex(eqn2)} \\end{cases}`, type: 'original' });

  const [l1, r1] = eqn1.split('=');
  const [l2, r2] = eqn2.split('=');

  const p1 = parseTerms(l1);
  const p1r = parseTerms(r1);
  const p2 = parseTerms(l2);
  const p2r = parseTerms(r2);

  // Normalize: ax + by = c
  const a1 = (p1.coeffs.x || 0) - (p1r.coeffs.x || 0);
  const b1 = (p1.coeffs.y || 0) - (p1r.coeffs.y || 0);
  const c1 = (p1r.constant || 0) - (p1.constant || 0);

  const a2 = (p2.coeffs.x || 0) - (p2r.coeffs.x || 0);
  const b2 = (p2.coeffs.y || 0) - (p2r.coeffs.y || 0);
  const c2 = (p2r.constant || 0) - (p2.constant || 0);

  const det = a1 * b2 - a2 * b1;

  steps.push({ label: 'Normalize', latex: `${a1}x + ${b1}y = ${c1} \\quad \\text{and} \\quad ${a2}x + ${b2}y = ${c2}`, type: 'step' });

  if (Math.abs(det) < 1e-10) {
    steps.push({ label: 'Solution', latex: '\\text{No unique solution (parallel or identical lines)}', type: 'error' });
    return steps;
  }

  steps.push({ label: 'Determinant', latex: `\\Delta = ${a1} \\cdot ${b2} - ${a2} \\cdot ${b1} = ${det}`, type: 'step' });

  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;

  const fmt = (n: number) => Number.isInteger(n) ? `${n}` : n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');

  steps.push({ label: 'Solve for x', latex: `x = \\frac{${c1} \\cdot ${b2} - ${c2} \\cdot ${b1}}{${det}} = ${fmt(x)}`, type: 'step' });
  steps.push({ label: 'Solve for y', latex: `y = \\frac{${a1} \\cdot ${c2} - ${a2} \\cdot ${c1}}{${det}} = ${fmt(y)}`, type: 'step' });
  steps.push({ label: 'Solution', latex: `x = ${fmt(x)}, \\quad y = ${fmt(y)}`, type: 'solution' });

  return steps;
}

/* ──────────────── Examples ──────────────── */

const examples = [
  '2x + 3 = 11',
  '5(x - 2) = 15',
  '3x - 7 = 2x + 5',
  '4x + 2 = 3x - 5',
  'x + y = 10, x - y = 4',
  '2x + 3y = 12, x - y = 1',
];

/* ──────────────── Component ──────────────── */

export default function EquationBalancer() {
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<SolveStep[]>([]);
  const [error, setError] = useState('');

  const solve = useCallback(() => {
    if (!input.trim()) return;

    try {
      if (input.includes(',')) {
        const parts = input.split(',').map(s => s.trim());
        if (parts.length !== 2) {
          setError('For systems, use: "eq1, eq2"');
          setSteps([]);
          return;
        }
        setSteps(solveSystem(parts[0], parts[1]));
      } else {
        setSteps(solveSingleEquation(input));
      }
      setError('');
    } catch {
      setError('Could not parse the equation. Check your format.');
      setSteps([]);
    }
  }, [input]);

  const reset = () => {
    setInput('');
    setSteps([]);
    setError('');
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="⚖"
        title="Equation Balancer"
        description="Balance and solve equations step by step"
        gradient="from-amber-500 to-orange-500"
      />

      {/* Input Card */}
      <Card className="border-amber-200/60 dark:border-amber-800/40 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider">
              Enter Equation
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              Single or system (comma-separated)
            </span>
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') solve(); }}
            placeholder='e.g. 2x + 3 = 11 or x+y=5, x-y=1'
            className="w-full h-11 px-4 rounded-xl bg-muted/60 border border-border text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 dark:bg-muted/40"
            style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
          />

          <div className="flex items-center gap-2">
            <Button
              onClick={solve}
              disabled={!input.trim()}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white h-10 shadow-sm"
            >
              <Play className="w-4 h-4 mr-2" /> Solve Step by Step
            </Button>
            {(input || steps.length > 0) && (
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

      {/* Steps */}
      <AnimatePresence>
        {steps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 mb-2">
              Solution Steps
            </p>

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.25 }}
              >
                <Card
                  className={`overflow-hidden transition-colors ${
                    step.type === 'solution'
                      ? 'border-amber-300/80 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20'
                      : step.type === 'error'
                      ? 'border-red-200/60 dark:border-red-800/40 bg-red-50/30 dark:bg-red-950/10'
                      : step.type === 'original'
                      ? 'border-amber-200/60 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10'
                      : 'border-border'
                  }`}
                >
                  <CardContent className="p-3.5 flex items-center gap-3">
                    {/* Step number */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        step.type === 'solution'
                          ? 'bg-amber-500 text-white'
                          : step.type === 'error'
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                          : step.type === 'original'
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.type === 'solution' ? '✓' : step.type === 'error' ? '!' : i + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                        step.type === 'solution'
                          ? 'text-amber-600 dark:text-amber-400'
                          : step.type === 'error'
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                      }`}>
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
                              ? 'text-amber-700 dark:text-amber-300'
                              : step.type === 'error'
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Example Equations */}
      {!steps.length && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground font-medium">Try an example:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => { setInput(ex); setSteps([]); setError(''); }}
                className="text-xs px-3 py-1.5 bg-card border border-border rounded-full hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all text-foreground hover:shadow-sm"
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
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Tips</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
              Use standard notation: 2x + 3 = 11, 5(x - 2) = 15
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
              For 2-variable systems, separate with a comma
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
              Supports distribution: a(x + b) = c
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}