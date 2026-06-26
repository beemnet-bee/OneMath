'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import KaTeXRenderer from '../KaTeXRenderer';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function LimitCalculator() {
  const [expr, setExpr] = useState('sin(x)/x');
  const [approach, setApproach] = useState('0');
  const [side, setSide] = useState<'both' | 'left' | 'right'>('both');
  const [result, setResult] = useState<{ answer: string; steps: string[]; latex: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const compute = async () => {
    setLoading(true);
    try {
      const sideStr = side === 'both' ? '' : ` from the ${side}`;
      const query = `Evaluate the limit: lim(x→${approach}${sideStr}) of ${expr}. Show step by step, try L'Hôpital's rule if applicable.`;
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: query, context: 'calculus' }),
      });
      const data = await res.json();
      setResult(data);
    } catch { setResult({ answer: 'Error computing limit', steps: [], latex: [] }); }
    finally { setLoading(false); }
  };

  const resultRows = result ? [
    { label: 'Result', value: result.answer, highlight: true },
  ] : [];

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="lim"
        title="Limit Calculator"
        description="Limit evaluation with L'Hôpital's rule via AI"
        gradient="from-purple-500 to-violet-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0" style={{ fontFamily: "'Latin Modern Math', serif" }}>lim</span>
              <Input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="sin(x)/x" className="flex-1 font-mono rounded-xl" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">as x →</span>
              <Input value={approach} onChange={(e) => setApproach(e.target.value)} placeholder="0" className="w-24 font-mono rounded-xl" />
            </div>
            <div className="flex gap-2">
              {(['both', 'left', 'right'] as const).map(s => (
                <Button key={s} variant={side === s ? 'default' : 'outline'} size="sm" onClick={() => setSide(s)} className="text-xs capitalize flex-1">
                  {s === 'both' ? 'Both sides' : s === 'left' ? '← Left' : 'Right →'}
                </Button>
              ))}
            </div>
            <Button
              onClick={compute}
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating...</> : 'Evaluate Limit'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Result" rows={resultRows} />

      {result && result.steps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card className="border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-3">Steps</p>
              <div className="space-y-2">
                {result.steps.map((s, i) => (
                  <div key={i} className="bg-muted/40 rounded-lg p-3 border border-border/40">
                    <p className="text-sm text-foreground">{s}</p>
                    {result.latex?.[i] && (
                      <div className="mt-2">
                        <KaTeXRenderer latex={result.latex[i]} className="text-sm" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}