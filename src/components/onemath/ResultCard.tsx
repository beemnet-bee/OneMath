'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface ResultRow {
  label: string;
  value: string;
  highlight?: boolean;
}

interface ResultCardProps {
  title: string;
  rows: ResultRow[];
  latex?: string[];
  KaTeXRenderer?: React.ComponentType<{ latex: string; className?: string }>;
  emptyMessage?: string;
}

export default function ResultCard({ title, rows, latex, KaTeXRenderer: KTR, emptyMessage }: ResultCardProps) {
  if (rows.length === 0 && (!latex || latex.length === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Card className="border-border/50 dark:border-border/30 shadow-sm overflow-hidden bg-gradient-to-br from-emerald-50/20 via-card to-teal-50/10 dark:from-emerald-950/8 dark:via-card dark:to-teal-950/5 card-stack card-hover-gradient">
        {/* Accent top line — refined gradient */}
        <div className="h-[2px] bg-gradient-to-r from-emerald-400/80 via-teal-300/60 to-transparent dark:from-emerald-500/60 dark:via-teal-400/40 dark:to-transparent" />
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40 pulse-dot" />
            <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
              {title}
            </p>
          </div>

          <div className="space-y-0">
            {rows.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }}
                className={`flex items-center justify-between py-2.5 group ${
                  i < rows.length - 1 ? 'border-b border-border/20' : ''
                }`}
              >
                <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground/70 transition-colors">{row.label}</span>
                <span
                  className={`text-sm font-medium text-right max-w-[60%] truncate number-math transition-colors ${
                    row.highlight
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold text-[15px]'
                      : 'text-foreground/80 group-hover:text-foreground'
                  }`}
                  style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', 'Times New Roman', serif" }}
                >
                  {row.value}
                </span>
              </motion.div>
            ))}
          </div>

          {latex && KTR && latex.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-3 space-y-2"
            >
              {latex.map((tex, i) => (
                <div key={i} className="math-display rounded-xl">
                  <KTR latex={tex} className="text-sm" />
                </div>
              ))}
            </motion.div>
          )}

          {emptyMessage && rows.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">{emptyMessage}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}