'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FeatureHeader from '../FeatureHeader';
import KaTeXRenderer from '../KaTeXRenderer';
import { Copy, Check, Table2 } from 'lucide-react';

/* ─── Types ─── */
interface TableRow {
  values: boolean[];
  result: boolean;
}

/* ─── Operator replacements for KaTeX ─── */
const TEX_REPLACEMENTS: [RegExp, string][] = [
  [/\bAND\b/g, ' \\land '],
  [/\bOR\b/g, ' \\lor '],
  [/\bNOT\b/g, '\\neg '],
  [/\bXOR\b/g, ' \\oplus '],
  [/\bIMPLIES\b/g, ' \\rightarrow '],
  [/\bIFF\b/g, ' \\leftrightarrow '],
  [/∧/g, ' \\land '],
  [/∨/g, ' \\lor '],
  [/¬/g, '\\neg '],
  [/⊕/g, ' \\oplus '],
  [/→/g, ' \\rightarrow '],
  [/↔/g, ' \\leftrightarrow '],
  [/->/g, ' \\rightarrow '],
  [/<->/g, ' \\leftrightarrow '],
  [/\^/g, ' \\oplus '],
  [/&/g, ' \\land '],
  [/\|/g, ' \\lor '],
  [/\+/g, ' \\lor '],
  [/~/g, '\\neg '],
];

/* ─── Helpers ─── */

/** Extract unique variables (single uppercase A-Z) from the expression, excluding operator keywords */
function extractVariables(expr: string): string[] {
  const opKeywords = new Set([
    'AND', 'OR', 'NOT', 'XOR', 'IMPLIES', 'IFF',
    'TRUE', 'FALSE', 'T', 'F',
  ]);
  const seen = new Set<string>();
  const vars: string[] = [];
  for (const ch of expr) {
    if (/[A-Z]/.test(ch) && !opKeywords.has(ch) && !seen.has(ch)) {
      // Make sure it's a standalone variable, not part of a keyword
      const before = expr[expr.indexOf(ch) - 1];
      const after = expr[expr.indexOf(ch) + 1];
      const isPartOfWord =
        (before && /[A-Z]/i.test(before)) || (after && /[A-Z]/i.test(after));
      if (!isPartOfWord || ch.length === 1 && !isPartOfWord) {
        seen.add(ch);
        vars.push(ch);
      }
    }
  }
  // Better approach: find all standalone uppercase letters
  return extractStandaloneVars(expr, opKeywords);
}

function extractStandaloneVars(expr: string, opKeywords: Set<string>): string[] {
  const seen = new Set<string>();
  const vars: string[] = [];

  // Match standalone uppercase letters (not surrounded by other word chars)
  const regex = /(?<![A-Za-z])([A-Z])(?![A-Za-z])/g;
  let match;
  while ((match = regex.exec(expr)) !== null) {
    const ch = match[1];
    if (!opKeywords.has(ch) && !seen.has(ch)) {
      seen.add(ch);
      vars.push(ch);
    }
  }
  return vars.sort();
}

/** Convert expression string to KaTeX LaTeX */
function toLatex(expr: string): string {
  let tex = expr;
  for (const [re, replacement] of TEX_REPLACEMENTS) {
    tex = tex.replace(re, replacement);
  }
  // Clean up extra spaces
  tex = tex.replace(/\s+/g, ' ').trim();
  return tex;
}

/** Convert human expression to evaluable JavaScript string */
function toEvalString(expr: string, vars: string[]): string {
  let js = expr;

  // Replace symbolic operators first (before text keywords to avoid conflicts)
  // XOR: ^ → custom XOR function call
  js = js.replace(/\^/g, ' XOR ');
  // IMPLIES: →
  js = js.replace(/→/g, ' IMPLIES ');
  js = js.replace(/->/g, ' IMPLIES ');
  // IFF: ↔
  js = js.replace(/↔/g, ' IFF ');
  js = js.replace(/<->/g, ' IFF ');
  // AND: ∧ &
  js = js.replace(/∧/g, ' AND ');
  js = js.replace(/&/g, ' AND ');
  // OR: ∨ | +
  js = js.replace(/∨/g, ' OR ');
  js = js.replace(/\|/g, ' OR ');
  js = js.replace(/\+/g, ' OR ');
  // NOT: ¬ ~ !
  js = js.replace(/¬/g, ' NOT ');
  js = js.replace(/~/g, ' NOT ');
  // XOR: ⊕
  js = js.replace(/⊕/g, ' XOR ');

  // Replace text operators with JS
  // Order matters: longer keywords first
  js = js.replace(/\bIMPLIES\b/g, 'IMP_OP');
  js = js.replace(/\bIFF\b/g, 'IFF_OP');
  js = js.replace(/\bXOR\b/g, 'XOR_OP');
  js = js.replace(/\bAND\b/g, '&&');
  js = js.replace(/\bOR\b/g, '||');
  js = js.replace(/\bNOT\b/g, '!');

  // Replace custom ops with JS equivalents
  js = js.replace(/IMP_OP/g, '<='); // A → B ≡ ¬A ∨ B ≡ (!A || B) ≡ A <= B for booleans
  js = js.replace(/IFF_OP/g, '===');
  js = js.replace(/XOR_OP/g, '!==');

  // Replace variable letters with their values
  for (const v of vars) {
    const regex = new RegExp(`(?<![A-Za-z])${v}(?![A-Za-z])`, 'g');
    js = js.replace(regex, `__${v}__`);
  }

  return js;
}

/** Evaluate a boolean expression string with given variable assignments */
function evaluateExpr(evalStr: string, varValues: Record<string, boolean>): boolean {
  let js = evalStr;
  for (const [v, val] of Object.entries(varValues)) {
    js = js.replace(new RegExp(`__${v}__`, 'g'), val ? 'true' : 'false');
  }
  // Handle double negation !! which can occur
  js = js.replace(/!!/g, '!');
  try {
    // Using Function constructor for safe-ish evaluation of boolean expressions
    const fn = new Function(`"use strict"; return (${js});`) as () => boolean;
    return fn() === true;
  } catch {
    return false;
  }
}

/** Generate all 2^n boolean combinations */
function generateCombinations(n: number): boolean[][] {
  const combos: boolean[][] = [];
  for (let i = 0; i < Math.pow(2, n); i++) {
    const row: boolean[] = [];
    for (let j = n - 1; j >= 0; j--) {
      row.push(Boolean((i >> j) & 1));
    }
    combos.push(row);
  }
  return combos;
}

/* ─── Examples ─── */
const EXAMPLES = [
  'A AND B',
  'A OR B',
  'NOT A AND B',
  'A → B',
  'A XOR B',
  '(A OR B) AND C',
];

/* ─── Component ─── */
export default function TruthTableGenerator() {
  const [expression, setExpression] = useState('');
  const [triggeredError, setTriggeredError] = useState('');
  const [copied, setCopied] = useState(false);

  const variables = useMemo(() => {
    if (!expression.trim()) return [];
    return extractVariables(expression);
  }, [expression]);

  const evalString = useMemo(() => {
    if (!expression.trim() || variables.length === 0) return '';
    try {
      return toEvalString(expression, variables);
    } catch {
      return '';
    }
  }, [expression, variables]);

  const { tableData, derivedError: tableError } = useMemo(() => {
    if (!expression.trim() || variables.length === 0 || !evalString)
      return { tableData: [] as TableRow[], derivedError: '' };

    if (variables.length > 8) {
      return { tableData: [] as TableRow[], derivedError: 'Too many variables (max 8 supported)' };
    }

    try {
      const combos = generateCombinations(variables.length);
      const rows = combos.map((combo) => {
        const varValues: Record<string, boolean> = {};
        variables.forEach((v, i) => {
          varValues[v] = combo[i];
        });
        const result = evaluateExpr(evalString, varValues);
        return { values: combo, result };
      });
      return { tableData: rows, derivedError: '' };
    } catch {
      return { tableData: [] as TableRow[], derivedError: 'Invalid expression. Please check syntax.' };
    }
  }, [expression, variables, evalString]);

  const stats = useMemo(() => {
    if (tableData.length === 0) return null;
    const trueCount = tableData.filter((r) => r.result).length;
    const falseCount = tableData.length - trueCount;
    return { trueCount, falseCount, total: tableData.length };
  }, [tableData]);

  const latex = useMemo(() => {
    if (!expression.trim()) return '';
    return toLatex(expression);
  }, [expression]);

  const error = triggeredError || tableError;

  const handleGenerate = useCallback(() => {
    if (!expression.trim()) {
      setTriggeredError('Please enter a boolean expression');
    } else if (variables.length === 0) {
      setTriggeredError('No variables found. Use single uppercase letters (A, B, C, ...)');
    } else {
      setTriggeredError('');
    }
  }, [expression, variables]);

  const handleCopy = useCallback(async () => {
    if (tableData.length === 0) return;
    const headers = [...variables, 'Result'].join('\t');
    const rows = tableData
      .map((r) => [...r.values.map((v) => (v ? 'T' : 'F')), r.result ? 'T' : 'F'].join('\t'))
      .join('\n');
    const text = `${headers}\n${rows}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [tableData, variables]);

  const hasResult = tableData.length > 0 && !error;

  return (
    <div className="space-y-4">
      <FeatureHeader
        icon="⊞"
        title="Truth Table Generator"
        description="Generate truth tables for boolean logic expressions"
        gradient="from-emerald-500 to-teal-600"
      />

      {/* Expression Input */}
      <Card className="border-border/60 bg-card">
        <CardContent className="p-4 space-y-3">
          <label className="text-xs font-semibold text-foreground">
            Boolean Expression
          </label>
          <div className="flex gap-2">
            <Input
              value={expression}
              onChange={(e) => {
                setExpression(e.target.value);
                setTriggeredError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              placeholder="e.g. A AND B, A → B, (A OR B) AND NOT C"
              className="font-medium text-sm placeholder:text-muted-foreground/60"
            />
            <Button
              onClick={handleGenerate}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 px-4"
            >
              <Table2 className="w-4 h-4 mr-1.5" />
              Generate
            </Button>
          </div>

          {/* Example buttons */}
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <motion.button
                key={ex}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setExpression(ex);
                  setTriggeredError('');
                }}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors font-medium ${
                  expression === ex
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                    : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                {ex}
              </motion.button>
            ))}
          </div>

          {/* Operator reference */}
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground/70">Operators:</span>{' '}
            AND / ∧ / &amp; &nbsp;|&nbsp; OR / ∨ / | &nbsp;|&nbsp; NOT / ¬ / ~ &nbsp;|&nbsp;
            XOR / ⊕ / ^ &nbsp;|&nbsp; → / -&gt; &nbsp;|&nbsp; ↔ / &lt;-&gt;
          </div>
        </CardContent>
      </Card>

      {/* KaTeX rendered expression */}
      <AnimatePresence>
        {expression.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <Card className="border-emerald-200/40 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/30 via-card to-teal-50/20 dark:from-emerald-950/10 dark:via-card dark:to-teal-950/5 overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 dark:from-emerald-500 dark:via-teal-500 dark:to-emerald-400" />
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
                    Expression
                  </p>
                </div>
                <div className="math-display flex items-center justify-center py-2">
                  <KaTeXRenderer latex={latex} displayMode className="text-base" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-xs text-red-500 dark:text-red-400 font-medium px-1"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics */}
      <AnimatePresence>
        {stats && hasResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="grid grid-cols-3 gap-2"
          >
            <Card className="border-border/60 bg-card">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">True</p>
                <p
                  className="text-xl font-bold text-emerald-600 dark:text-emerald-400 number-math"
                  style={{ fontFamily: "'Latin Modern Math', serif" }}
                >
                  {stats.trueCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">False</p>
                <p
                  className="text-xl font-bold text-foreground/70 number-math"
                  style={{ fontFamily: "'Latin Modern Math', serif" }}
                >
                  {stats.falseCount}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Rows</p>
                <p
                  className="text-xl font-bold text-foreground number-math"
                  style={{ fontFamily: "'Latin Modern Math', serif" }}
                >
                  {stats.total}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Truth Table */}
      <AnimatePresence>
        {hasResult && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <Card className="border-border/60 bg-card overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 dark:from-emerald-500 dark:via-teal-500 dark:to-emerald-400" />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
                      Truth Table
                    </p>
                    <span className="text-[10px] text-muted-foreground font-medium ml-1">
                      ({variables.length} variable{variables.length !== 1 ? 's' : ''}, {tableData.length} rows)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>

                <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-lg border border-border/50">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border/50 px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          #
                        </th>
                        {variables.map((v) => (
                          <th
                            key={v}
                            className="border border-border/50 px-3 py-2 text-[11px] font-bold text-foreground/80 uppercase tracking-wider text-center number-math"
                            style={{ fontFamily: "'Latin Modern Math', serif" }}
                          >
                            {v}
                          </th>
                        ))}
                        <th className="border border-border/50 px-3 py-2 text-[11px] font-bold text-white uppercase tracking-wider text-center bg-emerald-600 dark:bg-emerald-700">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.015, duration: 0.2 }}
                          className={idx % 2 === 1 ? 'bg-muted/30' : 'bg-card'}
                        >
                          <td className="border border-border/30 px-3 py-1.5 text-[11px] text-muted-foreground text-center font-mono">
                            {idx}
                          </td>
                          {row.values.map((val, vi) => (
                            <td
                              key={vi}
                              className="border border-border/30 px-3 py-1.5 text-center number-math font-medium"
                              style={{
                                fontFamily: "'Latin Modern Math', serif",
                                color: val
                                  ? 'var(--color-emerald-600, #059669)'
                                  : 'var(--color-foreground, inherit)',
                                opacity: val ? 1 : 0.5,
                              }}
                            >
                              {val ? 'T' : 'F'}
                            </td>
                          ))}
                          <td
                            className={`border border-border/30 px-3 py-1.5 text-center font-bold text-white number-math ${
                              row.result
                                ? 'bg-emerald-500/90 dark:bg-emerald-600/90'
                                : 'bg-red-400/80 dark:bg-red-500/80'
                            }`}
                            style={{ fontFamily: "'Latin Modern Math', serif" }}
                          >
                            {row.result ? 'T' : 'F'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Expression classification */}
                {stats && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stats.trueCount === 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold">
                        Contradiction (always false)
                      </span>
                    )}
                    {stats.falseCount === 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
                        Tautology (always true)
                      </span>
                    )}
                    {stats.trueCount > 0 && stats.falseCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold">
                        Contingent ({stats.trueCount}T / {stats.falseCount}F)
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!expression.trim() && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-muted-foreground"
        >
          <Table2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-xs font-medium">Enter a boolean expression to generate its truth table</p>
          <p className="text-[11px] mt-1 opacity-60">Try one of the examples above</p>
        </motion.div>
      )}
    </div>
  );
}