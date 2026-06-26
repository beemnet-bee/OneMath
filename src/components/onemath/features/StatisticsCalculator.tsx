'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';
import { useOneMathStore } from '@/stores/onemath-store';

export default function StatisticsCalculator() {
  const [data, setData] = useState('');
  const [rows, setRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);
  const { addToHistory } = useOneMathStore();

  const compute = () => {
    const nums = data.split(/[,\s\n]+/).map(Number).filter(n => !isNaN(n));
    if (nums.length === 0) { setRows([{ label: 'Error', value: 'Enter valid numbers' }]); return; }

    const n = nums.length;
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const freq: Record<number, number> = {};
    nums.forEach(v => freq[v] = (freq[v] || 0) + 1);
    const maxFreq = Math.max(...Object.values(freq));
    const modes = Object.entries(freq).filter(([, f]) => f === maxFreq).map(([v]) => v);
    const mode = maxFreq === 1 ? 'No mode' : modes.join(', ');

    const variance = nums.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const sampleVariance = n > 1 ? nums.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);
    const sampleStdDev = Math.sqrt(sampleVariance);
    const range = sorted[n - 1] - sorted[0];

    const q1 = sorted[Math.floor(n / 4)];
    const q3 = sorted[Math.floor(3 * n / 4)];
    const iqr = q3 - q1;

    const skewness = n > 2 ? (nums.reduce((s, v) => s + ((v - mean) / stdDev) ** 3, 0)) * n / ((n - 1) * (n - 2)) : 0;
    const kurtosis = stdDev > 0 ? nums.reduce((s, v) => s + ((v - mean) / stdDev) ** 4, 0) / n - 3 : 0;

    setRows([
      { label: 'Count (n)', value: n.toString() },
      { label: 'Sum', value: sum.toFixed(4) },
      { label: 'Mean (μ)', value: mean.toFixed(6), highlight: true },
      { label: 'Median', value: median().toFixed(6), highlight: true },
      { label: 'Mode', value: mode },
      { label: 'Range', value: range.toFixed(4) },
      { label: 'Variance (σ²)', value: variance.toFixed(6) },
      { label: 'Std Deviation (σ)', value: stdDev.toFixed(6), highlight: true },
      { label: 'Sample Var (s²)', value: sampleVariance.toFixed(6) },
      { label: 'Sample Std (s)', value: sampleStdDev.toFixed(6) },
      { label: 'Min', value: sorted[0].toString() },
      { label: 'Max', value: sorted[n - 1].toString() },
      { label: 'Q1 (25th)', value: q1.toFixed(4) },
      { label: 'Q3 (75th)', value: q3.toFixed(4) },
      { label: 'IQR', value: iqr.toFixed(4) },
      { label: 'Skewness', value: skewness.toFixed(6) },
      { label: 'Kurtosis', value: kurtosis.toFixed(6) },
    ]);

    function median() {
      return n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    }

    addToHistory({ type: 'Statistics', input: `${n} data points`, output: `μ=${mean.toFixed(4)}, σ=${stdDev.toFixed(4)}` });
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader icon="μ,σ" title="Statistics" description="Comprehensive statistical analysis" gradient="from-purple-500 to-pink-500" />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">Enter numbers separated by commas or spaces</p>
            <Textarea
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="1, 2, 3, 4, 5, 6, 7, 8, 9, 10"
              className="min-h-[80px] text-sm rounded-xl resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) compute();
              }}
            />
            <Button
              onClick={compute}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
            >
              Calculate Statistics
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {rows.length > 0 && <ResultCard title="Statistical Results" rows={rows} />}
    </div>
  );
}