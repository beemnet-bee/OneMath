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
import { useOneMathStore } from '@/stores/onemath-store';

export default function DerivativeCalculator() {
  const [expr, setExpr] = useState('x^3 + 2*x^2 - 5*x + 3');
  const [result, setResult] = useState<{ derivative: string; steps: string[]; latex: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToHistory } = useOneMathStore();

  const compute = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: `Find the derivative of ${expr} with respect to x. Show each step clearly.`, context: 'calculus' }),
      });
      const data = await res.json();
      setResult({ derivative: data.answer, steps: data.steps || [], latex: data.latex || [] });
      addToHistory({ type: 'Derivative', input: `d/dx(${expr})`, output: data.answer || 'Done' });
    } catch { setResult({ derivative: 'Error computing derivative', steps: [], latex: [] }); }
    finally { setLoading(false); }
  };

  const resultRows = result ? [
    { label: "f'(x)", value: result.derivative, highlight: true },
  ] : [];

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="d/dx"
        title="Derivative Calculator"
        description="AI-powered symbolic derivatives"
        gradient="from-red-500 to-orange-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">f(x) =</span>
              <Input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="e.g. x^3 + 2*x" className="font-mono rounded-xl" />
            </div>
            <Button
              onClick={compute}
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Computing...</> : 'Find Derivative'}
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
                    {result.latex[i] && (
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