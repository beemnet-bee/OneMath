'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import KaTeXRenderer from '../KaTeXRenderer';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

const shapes = [
  { id: 'circle', name: 'Circle', icon: '⭕' },
  { id: 'rectangle', name: 'Rectangle', icon: '▬' },
  { id: 'triangle', name: 'Triangle', icon: '△' },
  { id: 'trapezoid', name: 'Trapezoid', icon: '⏢' },
  { id: 'sphere', name: 'Sphere', icon: '🔵' },
  { id: 'cylinder', name: 'Cylinder', icon: '🛢️' },
  { id: 'cone', name: 'Cone', icon: '🔺' },
  { id: 'pyramid', name: 'Pyramid', icon: '▲' },
  { id: 'ellipse', name: 'Ellipse', icon: '⬮' },
];

const shapeFields: Record<string, string[]> = {
  circle: ['Radius'],
  rectangle: ['Length', 'Width', 'Height (optional)'],
  triangle: ['Base', 'Height', 'Side A', 'Side B', 'Side C'],
  trapezoid: ['Base 1', 'Base 2', 'Height', 'Side 1', 'Side 2'],
  sphere: ['Radius'],
  cylinder: ['Radius', 'Height'],
  cone: ['Radius', 'Height', 'Slant Height (optional)'],
  pyramid: ['Base Length', 'Base Width', 'Height'],
  ellipse: ['Semi-major axis (a)', 'Semi-minor axis (b)'],
};

export default function GeometryCalculator() {
  const [shape, setShape] = useState('circle');
  const [values, setValues] = useState<Record<string, string>>({});
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);
  const [resultLatex, setResultLatex] = useState<string[]>([]);

  const getFields = () => shapeFields[shape] || [];

  const calculate = () => {
    const v = (key: string) => parseFloat(values[key]) || 0;
    const rows: { label: string; value: string; highlight?: boolean }[] = [];
    const tex: string[] = [];

    switch (shape) {
      case 'circle': {
        const r = v('Radius');
        rows.push({ label: 'Area (πr²)', value: (Math.PI * r * r).toFixed(4), highlight: true });
        rows.push({ label: 'Circumference (2πr)', value: (2 * Math.PI * r).toFixed(4), highlight: true });
        tex.push(`A = \\pi r^2 = ${Math.PI * r * r}`);
        break;
      }
      case 'rectangle': {
        const l = v('Length'), w = v('Width'), h = v('Height (optional)');
        rows.push({ label: 'Area', value: String(l * w), highlight: true });
        rows.push({ label: 'Perimeter', value: String(2 * (l + w)) });
        if (h > 0) {
          rows.push({ label: 'Volume', value: String(l * w * h), highlight: true });
          rows.push({ label: 'Surface Area', value: String(2 * (l * w + l * h + w * h)) });
        }
        break;
      }
      case 'triangle': {
        const b = v('Base'), h = v('Height'), a = v('Side A'), c = v('Side B'), d = v('Side C');
        rows.push({ label: 'Area (½bh)', value: (0.5 * b * h).toFixed(4), highlight: true });
        if (a > 0 && c > 0 && d > 0) {
          rows.push({ label: 'Perimeter', value: String(a + c + d) });
          const s = (a + c + d) / 2;
          rows.push({ label: 'Heron Area', value: Math.sqrt(s * (s - a) * (s - c) * (s - d)).toFixed(4) });
        }
        break;
      }
      case 'trapezoid': {
        const b1 = v('Base 1'), b2 = v('Base 2'), h = v('Height');
        rows.push({ label: 'Area (½(b₁+b₂)h)', value: (0.5 * (b1 + b2) * h).toFixed(4), highlight: true });
        tex.push(`A = \\frac{1}{2}(${b1}+${b2}) \\times ${h} = ${(0.5 * (b1 + b2) * h).toFixed(4)}`);
        break;
      }
      case 'sphere': {
        const r = v('Radius');
        rows.push({ label: 'Volume (⁴⁄₃πr³)', value: (4 / 3 * Math.PI * r ** 3).toFixed(4), highlight: true });
        rows.push({ label: 'Surface Area (4πr²)', value: (4 * Math.PI * r * r).toFixed(4), highlight: true });
        tex.push(`V = \\frac{4}{3}\\pi r^3`);
        break;
      }
      case 'cylinder': {
        const r = v('Radius'), h = v('Height');
        rows.push({ label: 'Volume (πr²h)', value: (Math.PI * r * r * h).toFixed(4), highlight: true });
        rows.push({ label: 'Lateral Area (2πrh)', value: (2 * Math.PI * r * h).toFixed(4) });
        rows.push({ label: 'Total Surface (2πr(r+h))', value: (2 * Math.PI * r * (r + h)).toFixed(4) });
        break;
      }
      case 'cone': {
        const r = v('Radius'), h = v('Height'), sl = v('Slant Height (optional)');
        const l = sl || Math.sqrt(r * r + h * h);
        rows.push({ label: 'Volume (⅓πr²h)', value: (Math.PI * r * r * h / 3).toFixed(4), highlight: true });
        rows.push({ label: 'Slant Height', value: l.toFixed(4) });
        rows.push({ label: 'Lateral Area (πrl)', value: (Math.PI * r * l).toFixed(4) });
        break;
      }
      case 'pyramid': {
        const bl = v('Base Length'), bw = v('Base Width'), h = v('Height');
        rows.push({ label: 'Volume (⅓Bh)', value: (bl * bw * h / 3).toFixed(4), highlight: true });
        break;
      }
      case 'ellipse': {
        const a = v('Semi-major axis (a)'), b = v('Semi-minor axis (b)');
        rows.push({ label: 'Area (πab)', value: (Math.PI * a * b).toFixed(4), highlight: true });
        rows.push({ label: 'Perimeter ≈', value: (Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))).toFixed(4) });
        tex.push(`A = \\pi ab`);
        break;
      }
    }

    setResultRows(rows);
    setResultLatex(tex);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="📏"
        title="Geometry Calculator"
        description="9 shapes: circle, rectangle, triangle, sphere, and more"
        gradient="from-green-500 to-emerald-500"
      />

      <div className="flex flex-wrap gap-2">
        {shapes.map(s => (
          <Button
            key={s.id}
            variant={shape === s.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setShape(s.id); setValues({}); setResultRows([]); setResultLatex([]); }}
            className="h-10 text-xs"
          >
            {s.icon} {s.name}
          </Button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              {getFields().map(field => (
                <div key={field} className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-32 shrink-0">{field}</label>
                  <Input
                    type="number"
                    value={values[field] || ''}
                    onChange={(e) => setValues(prev => ({ ...prev, [field]: e.target.value }))}
                    className="flex-1 h-10 text-sm rounded-xl"
                  />
                </div>
              ))}
            </div>
            <Button onClick={calculate} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">
              Calculate
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Results" rows={resultRows} latex={resultLatex} KaTeXRenderer={KaTeXRenderer} />
    </div>
  );
}