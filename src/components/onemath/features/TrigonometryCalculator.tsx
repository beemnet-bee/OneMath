'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import KaTeXRenderer from '../KaTeXRenderer';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

export default function TrigonometryCalculator() {
  const [angle, setAngle] = useState('');
  const [isDeg, setIsDeg] = useState(true);
  const [rows, setRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const calculate = () => {
    const a = parseFloat(angle);
    if (isNaN(a)) return;
    const rad = isDeg ? (a * Math.PI) / 180 : a;
    const deg = isDeg ? a : (a * 180) / Math.PI;

    setRows([
      { label: 'Angle (degrees)', value: `${deg.toFixed(6)}°` },
      { label: 'Angle (radians)', value: `${rad.toFixed(6)} rad` },
      { label: 'sin(θ)', value: Math.sin(rad).toFixed(8), highlight: true },
      { label: 'cos(θ)', value: Math.cos(rad).toFixed(8), highlight: true },
      { label: 'tan(θ)', value: Math.tan(rad).toFixed(8) },
      { label: 'csc(θ)', value: (1 / Math.sin(rad)).toFixed(8) },
      { label: 'sec(θ)', value: (1 / Math.cos(rad)).toFixed(8) },
      { label: 'cot(θ)', value: (1 / Math.tan(rad)).toFixed(8) },
      { label: 'arcsin (deg)', value: `${(Math.asin(Math.sin(rad)) * 180 / Math.PI).toFixed(4)}°` },
      { label: 'arccos (deg)', value: `${(Math.acos(Math.cos(rad)) * 180 / Math.PI).toFixed(4)}°` },
    ]);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader icon="θ" title="Trigonometry" description="All trig functions + unit circle" gradient="from-amber-500 to-orange-500" />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                placeholder="Enter angle"
                className="flex-1 h-11 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && calculate()}
              />
              <button
                onClick={() => setIsDeg(true)}
                className={`h-11 px-3.5 rounded-xl text-xs font-bold transition-all ${
                  isDeg
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                }`}
              >
                DEG
              </button>
              <button
                onClick={() => setIsDeg(false)}
                className={`h-11 px-3.5 rounded-xl text-xs font-bold transition-all ${
                  !isDeg
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                }`}
              >
                RAD
              </button>
            </div>
            <Button
              onClick={calculate}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20"
            >
              Calculate
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {rows.length > 0 && <ResultCard title="Trigonometric Values" rows={rows} />}

      {/* Key Identities */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-2.5">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Key Identities</p>
            <div className="math-display space-y-2">
              <KaTeXRenderer latex="\\sin^2\\theta + \\cos^2\\theta = 1" />
              <KaTeXRenderer latex="\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta" />
              <KaTeXRenderer latex="\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta" />
            </div>

            {/* Unit Circle Quick Reference */}
            <div className="mt-3 pt-3 border-t border-border/40">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Quick Reference</p>
              <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                {[
                  ['0°', '0', '1'], ['30°', '½', '√3/2'], ['45°', '√2/2', '√2/2'],
                  ['60°', '√3/2', '½'], ['90°', '1', '0'],
                ].map(([deg, sin, cos]) => (
                  <div key={deg} className="p-1.5 bg-muted/40 rounded-lg border border-border/30">
                    <p className="font-bold text-foreground number-math" style={{ fontFamily: "'Latin Modern Math', serif" }}>{deg}</p>
                    <p className="text-muted-foreground mt-0.5">s={sin}</p>
                    <p className="text-muted-foreground">c={cos}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}