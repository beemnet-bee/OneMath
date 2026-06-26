'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import KaTeXRenderer from '../KaTeXRenderer';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

function VecInput({ label, x, y, z, sx, sy, sz }: { label: string; x: string; y: string; z: string; sx: (v: string) => void; sy: (v: string) => void; sz: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-foreground w-6" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>{label}</span>
      <span className="text-muted-foreground text-sm">(</span>
      <Input type="number" value={x} onChange={e => sx(e.target.value)} className="w-16 h-9 text-xs text-center font-mono rounded-xl" />
      <span className="text-muted-foreground text-xs">,</span>
      <Input type="number" value={y} onChange={e => sy(e.target.value)} className="w-16 h-9 text-xs text-center font-mono rounded-xl" />
      <span className="text-muted-foreground text-xs">,</span>
      <Input type="number" value={z} onChange={e => sz(e.target.value)} className="w-16 h-9 text-xs text-center font-mono rounded-xl" />
      <span className="text-muted-foreground text-sm">)</span>
    </div>
  );
}

export default function VectorCalculator() {
  const [ax, setAx] = useState('1'); const [ay, setAy] = useState('2'); const [az, setAz] = useState('3');
  const [bx, setBx] = useState('4'); const [by, setBy] = useState('5'); const [bz, setBz] = useState('6');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);
  const [latex, setLatex] = useState<string[]>([]);

  const calculate = () => {
    const A = [parseFloat(ax)||0, parseFloat(ay)||0, parseFloat(az)||0];
    const B = [parseFloat(bx)||0, parseFloat(by)||0, parseFloat(bz)||0];

    const dot = A[0]*B[0] + A[1]*B[1] + A[2]*B[2];
    const magA = Math.sqrt(A[0]**2 + A[1]**2 + A[2]**2);
    const magB = Math.sqrt(B[0]**2 + B[1]**2 + B[2]**2);
    const cosTheta = magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
    const angle = Math.acos(Math.min(1, Math.max(-1, cosTheta))) * 180 / Math.PI;

    const cross = [
      A[1]*B[2] - A[2]*B[1],
      A[2]*B[0] - A[0]*B[2],
      A[0]*B[1] - A[1]*B[0],
    ];

    const add = A.map((v, i) => v + B[i]);
    const sub = A.map((v, i) => v - B[i]);
    const projMag = magB > 0 ? dot / (magB * magB) : 0;
    const proj = B.map(v => v * projMag);

    setResultRows([
      { label: '|A|', value: magA.toFixed(4) },
      { label: '|B|', value: magB.toFixed(4) },
      { label: 'A · B (dot)', value: dot.toFixed(4), highlight: true },
      { label: 'θ', value: `${angle.toFixed(4)}°`, highlight: true },
      { label: 'cos(θ)', value: cosTheta.toFixed(6) },
      { label: 'A + B', value: `(${add.map(v => v.toFixed(2)).join(', ')})` },
      { label: 'A - B', value: `(${sub.map(v => v.toFixed(2)).join(', ')})` },
      { label: 'A × B (cross)', value: `(${cross.map(v => v.toFixed(2)).join(', ')})`, highlight: true },
      { label: '|A × B|', value: Math.sqrt(cross[0]**2 + cross[1]**2 + cross[2]**2).toFixed(4) },
      { label: 'proj_A onto B', value: `(${proj.map(v => v.toFixed(4)).join(', ')})` },
    ]);
    setLatex([
      `\\vec{A} \\cdot \\vec{B} = ${dot.toFixed(2)}`,
      `|\\vec{A} \\times \\vec{B}| = ${Math.sqrt(cross[0]**2 + cross[1]**2 + cross[2]**2).toFixed(2)}`,
    ]);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="→"
        title="Vector Calculator"
        description="3D vectors: dot, cross, angle, projection, magnitude"
        gradient="from-cyan-500 to-blue-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <VecInput label="A" x={ax} y={ay} z={az} sx={setAx} sy={setAy} sz={setAz} />
            <VecInput label="B" x={bx} y={by} z={bz} sx={setBx} sy={setBy} sz={setBz} />
            <Button onClick={calculate} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Calculate All</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} latex={latex} KaTeXRenderer={KaTeXRenderer} />
    </div>
  );
}