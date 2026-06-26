'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';

const conversions: Record<string, Record<string, number>> = {
  length: { 'm': 1, 'km': 1000, 'cm': 0.01, 'mm': 0.001, 'mi': 1609.34, 'yd': 0.9144, 'ft': 0.3048, 'in': 0.0254 },
  weight: { 'kg': 1, 'g': 0.001, 'mg': 0.000001, 'lb': 0.453592, 'oz': 0.0283495, 'ton': 1000 },
  temperature: { '°C': 1, '°F': 1, 'K': 1 },
  area: { 'm²': 1, 'km²': 1e6, 'cm²': 0.0001, 'ft²': 0.092903, 'acre': 4046.86, 'ha': 10000 },
  volume: { 'L': 1, 'mL': 0.001, 'm³': 1000, 'gal': 3.78541, 'ft³': 28.3168, 'cup': 0.236588 },
  speed: { 'm/s': 1, 'km/h': 0.277778, 'mph': 0.44704, 'knot': 0.514444 },
  time: { 's': 1, 'min': 60, 'hr': 3600, 'day': 86400, 'week': 604800, 'month': 2592000, 'year': 31536000 },
};

const categories = Object.keys(conversions);
const unitsByCategory = Object.fromEntries(categories.map(c => [c, Object.keys(conversions[c])]));

export default function UnitConverter() {
  const [category, setCategory] = useState('length');
  const [value, setValue] = useState('1');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('km');
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);

  const convert = () => {
    const v = parseFloat(value);
    if (isNaN(v)) return;
    const units = conversions[category];
    let r: number;
    if (category === 'temperature') {
      if (from === to) { r = v; }
      else if (from === '°C' && to === '°F') r = v * 9 / 5 + 32;
      else if (from === '°F' && to === '°C') r = (v - 32) * 5 / 9;
      else if (from === '°C' && to === 'K') r = v + 273.15;
      else if (from === 'K' && to === '°C') r = v - 273.15;
      else if (from === '°F' && to === 'K') r = (v - 32) * 5 / 9 + 273.15;
      else if (from === 'K' && to === '°F') r = (v - 273.15) * 9 / 5 + 32;
      else r = v;
    } else {
      r = v * units[from] / units[to];
    }
    setResultRows([
      { label: 'Conversion', value: `${v} ${from} = ${r.toFixed(6)} ${to}`, highlight: true },
    ]);
  };

  const units = unitsByCategory[category] || [];

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="🔄"
        title="Unit Converter"
        description="Length, weight, temperature, area, volume, speed, time"
        gradient="from-emerald-500 to-lime-500"
      />

      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => { setCategory(c); const u = unitsByCategory[c]; setFrom(u[0]); setTo(u[1] || u[0]); setResultRows([]); }} className="h-10 text-xs capitalize">{c}</Button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" className="h-10 rounded-xl" />
            <div className="grid grid-cols-5 gap-2 items-center">
              <div className="col-span-2">
                <select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full h-10 text-sm bg-muted/40 border border-border/40 rounded-xl px-2">
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <span className="text-center text-muted-foreground">→</span>
              <div className="col-span-2">
                <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full h-10 text-sm bg-muted/40 border border-border/40 rounded-xl px-2">
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <Button onClick={convert} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">Convert</Button>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Result" rows={resultRows} />
    </div>
  );
}