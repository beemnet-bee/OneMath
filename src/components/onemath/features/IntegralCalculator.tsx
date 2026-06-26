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

export default function IntegralCalculator() {
  const [expr, setExpr] = useState('x^2 + 3*x');
  const [lower, setLower] = useState('0');
  const [upper, setUpper] = useState('1');
  const [result, setResult] = useState<{ answer: string; steps: string[]; latex: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToHistory } = useOneMathStore();

  const compute = async () => {
    setLoading(true);
    try {
      const hasBounds = lower && upper;
      const query = hasBounds
        ? `Evaluate the definite integral of ${expr} from ${lower} to ${upper}. Show step by step.`
        : `Find the indefinite integral of ${expr}. Include + C. Show step by step.`;
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: query, context: 'calculus' }),
      });
      const data = await res.json();
      setResult(data);
      addToHistory({ type: 'Integral', input: `∫${expr} dx`, output: data.answer || 'Done' });
    } catch { setResult({ answer: 'Error computing integral', steps: [], latex: [] }); }
    finally { setLoading(false); }
  };

  const resultRows = result ? [
    { label: 'Result', value: result.answer, highlight: true },
  ] : [];

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="∫"
        title="Integral Calculator"
        description="Definite and indefinite integrals via AI"
        gradient="from-blue-500 to-indigo-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">∫</span>
              <Input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="e.g. x^2" className="font-mono rounded-xl" />
              <span className="text-sm text-muted-foreground shrink-0">dx</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground">Bounds:</span>
              <Input value={lower} onChange={(e) => setLower(e.target.value)} placeholder="lower" className="w-20 h-9 text-sm text-center font-mono rounded-xl" />
              <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Latin Modern Math', serif" }}>→</span>
              <Input value={upper} onChange={(e) => setUpper(e.target.value)} placeholder="upper" className="w-20 h-9 text-sm text-center font-mono rounded-xl" />
              <span className="text-[10px] text-muted-foreground">(empty = indefinite)</span>
            </div>
            <Button
              onClick={compute}
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Computing...</> : 'Integrate'}
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