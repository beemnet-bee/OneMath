'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import KaTeXRenderer from '../KaTeXRenderer';
import FeatureHeader from '../FeatureHeader';

export default function LaTeXRenderer() {
  const [input, setInput] = useState('E = mc^2');
  const [history, setHistory] = useState<string[]>(['\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', 'e^{i\\pi} + 1 = 0', '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}']);

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="𝐿"
        title="LaTeX Renderer"
        description="Input and render any LaTeX code"
        gradient="from-gray-500 to-slate-500"
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">Enter LaTeX code to render:</p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full min-h-[80px] p-3 text-sm bg-muted/40 rounded-xl border border-border/40 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              placeholder="e.g. \\frac{1}{2} or x^2 + 2x + 1"
            />
            <Button onClick={() => { if (input.trim() && !history.includes(input.trim())) setHistory([input.trim(), ...history.slice(0, 9)]); }}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20">
              Add to History
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {input.trim() && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card className="shadow-sm border-emerald-200/60 dark:border-emerald-800/40">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-3">Rendered Output</p>
              <div className="math-display p-4 bg-white dark:bg-zinc-900 rounded-xl text-center border border-border/40">
                <KaTeXRenderer latex={input} className="text-xl" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-mono break-all">Input: {input}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-2">History</p>
          <div className="space-y-2">
            {history.map((tex, i) => (
              <Card key={i} className="shadow-sm border-border/40 cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => setInput(tex)}>
                <CardContent className="p-3">
                  <KaTeXRenderer latex={tex} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}