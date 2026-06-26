'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Plus, Trash2, RotateCcw, ZoomIn, ZoomOut, Grid3X3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOneMathStore } from '@/stores/onemath-store';

const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

const presets = [
  { label: 'x²', expr: 'x^2' },
  { label: 'sin(x)', expr: 'sin(x)' },
  { label: 'cos(x)', expr: 'cos(x)' },
  { label: 'x³-3x', expr: 'x^3 - 3*x' },
  { label: '1/x', expr: '1/x' },
  { label: '√x', expr: 'sqrt(x)' },
  { label: 'eˣ', expr: 'e^x' },
  { label: 'ln(x)', expr: 'log(x)' },
  { label: '|x|', expr: 'abs(x)' },
  { label: 'tan(x)', expr: 'tan(x)' },
];

interface EqEntry {
  id: string;
  expr: string;
  color: string;
  data: Array<{ x: number; y: number | null }>;
}

export default function EquationGrapher() {
  const [equations, setEquations] = useState<EqEntry[]>([
    { id: '1', expr: 'x^2', color: COLORS[0], data: [] },
  ]);
  const [newExpr, setNewExpr] = useState('');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const { addToHistory } = useOneMathStore();

  const graphEquation = useCallback(async (expr: string, eqId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: expr, xMin, xMax, points: 300 }),
      });
      const data = await res.json();
      setEquations((prev) =>
        prev.map((eq) => (eq.id === eqId ? { ...eq, data: data.points } : eq))
      );
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [xMin, xMax]);

  const addEquation = () => {
    if (!newExpr.trim()) return;
    const id = Date.now().toString();
    const color = COLORS[equations.length % COLORS.length];
    const newEq: EqEntry = { id, expr: newExpr.trim(), color, data: [] };
    setEquations((prev) => [...prev, newEq]);
    setNewExpr('');
    graphEquation(newExpr.trim(), id);
  };

  const removeEquation = (id: string) => {
    setEquations((prev) => prev.filter((eq) => eq.id !== id));
  };

  const updateEquation = (id: string, expr: string) => {
    setEquations((prev) => prev.map((eq) => (eq.id === id ? { ...eq, expr } : eq)));
    if (expr.trim()) graphEquation(expr.trim(), id);
  };

  const handleGraphAll = () => {
    equations.forEach((eq) => {
      if (eq.expr.trim()) graphEquation(eq.expr.trim(), eq.id);
    });
    addToHistory({
      type: 'Graph',
      input: equations.map((e) => e.expr).join(', '),
      output: `Graphed ${equations.length} equation(s)`,
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 0.75 : 1.33;
    setXMin(Math.round(xMin * factor));
    setXMax(Math.round(xMax * factor));
  };

  const reset = () => {
    setEquations([{ id: '1', expr: 'x^2', color: COLORS[0], data: [] }]);
    setXMin(-10);
    setXMax(10);
    setNewExpr('');
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground leading-tight">Equation Grapher</h2>
          <p className="text-[10px] text-muted-foreground">Plot and visualize functions</p>
        </div>
      </div>

      {/* Graph Display */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-emerald-200/40 dark:border-emerald-800/30 shadow-sm">
          <CardContent className="p-0">
            <div className="h-[300px] w-full bg-gradient-to-b from-muted/30 to-transparent">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />}
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={[xMin, xMax]}
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [value.toFixed(4), 'y']}
                    labelFormatter={(label) => `x = ${label}`}
                  />
                  <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  {equations.map((eq) => (
                    <Line
                      key={eq.id}
                      type="monotone"
                      data={eq.data}
                      dataKey="y"
                      stroke={eq.color}
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Controls Row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-1">
          <Button variant="ghost" size="icon" onClick={() => handleZoom('in')} title="Zoom In" className="h-8 w-8">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border" />
          <Button variant="ghost" size="icon" onClick={() => handleZoom('out')} title="Zoom Out" className="h-8 w-8">
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-colors ${
            showGrid
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
              : 'bg-muted/60 text-muted-foreground border border-transparent hover:bg-muted'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          Grid
        </button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={reset} title="Reset" className="h-8 w-8 text-muted-foreground">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          onClick={handleGraphAll}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 rounded-lg shadow-sm shadow-emerald-500/20"
        >
          {loading ? 'Graphing...' : 'Graph All'}
        </Button>
      </div>

      {/* Range Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-muted-foreground font-medium">X range:</label>
          <Input
            type="number"
            value={xMin}
            onChange={(e) => setXMin(Number(e.target.value))}
            className="w-20 h-8 text-xs number-math"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="number"
            value={xMax}
            onChange={(e) => setXMax(Number(e.target.value))}
            className="w-20 h-8 text-xs number-math"
          />
        </div>
      </div>

      {/* Equation List */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Equations</p>
        {equations.map((eq, idx) => (
          <motion.div
            key={eq.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-2"
          >
            <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: eq.color }} />
            <Input
              value={eq.expr}
              onChange={(e) => updateEquation(eq.id, e.target.value)}
              placeholder="e.g. x^2 + 2*x"
              className="flex-1 h-9 text-sm font-mono"
              onKeyDown={(e) => e.key === 'Enter' && updateEquation(eq.id, eq.expr)}
            />
            {equations.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEquation(eq.id)}
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Equation */}
      <div className="flex gap-2">
        <Input
          value={newExpr}
          onChange={(e) => setNewExpr(e.target.value)}
          placeholder="Add equation (e.g. sin(x))"
          className="flex-1 h-9 text-sm font-mono"
          onKeyDown={(e) => e.key === 'Enter' && addEquation()}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={addEquation}
          disabled={!newExpr.trim()}
          className="h-9 w-9 shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Presets */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Presets</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <Badge
              key={p.expr}
              variant="outline"
              className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all duration-200 px-2.5 py-1"
              onClick={() => {
                const id = Date.now().toString();
                const color = COLORS[equations.length % COLORS.length];
                setEquations((prev) => [...prev, { id, expr: p.expr, color, data: [] }]);
                graphEquation(p.expr, id);
              }}
            >
              <span
                className="font-medium"
                style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
              >
                {p.label}
              </span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}