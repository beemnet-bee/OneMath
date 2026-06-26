'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Clock, Calculator, LineChart, BookOpen, Grid3X3, Filter, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOneMathStore, type HistoryEntry } from '@/stores/onemath-store';
import FeatureHeader from '../FeatureHeader';

const typeIcons: Record<string, React.ElementType> = {
  Solve: Calculator,
  Graph: LineChart,
  Statistics: Grid3X3,
  Calc: Calculator,
};

const typeColors: Record<string, string> = {
  Solve: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
  Graph: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
  Statistics: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40',
  Calc: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40',
  Image: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-800/40',
  default: 'bg-muted text-muted-foreground border-border',
};

export default function SolutionHistory() {
  const { history, clearHistory, setTab } = useOneMathStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  const types = useMemo(() => {
    const s = new Set(history.map(h => h.type));
    return ['All', ...Array.from(s).sort()];
  }, [history]);

  const filtered = useMemo(() => {
    return history.filter((h) => {
      const matchType = filterType === 'All' || h.type === filterType;
      const q = search.toLowerCase();
      const matchSearch = !q || h.input.toLowerCase().includes(q) || h.output.toLowerCase().includes(q) || h.type.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [history, search, filterType]);

  const handleExport = () => {
    const text = filtered.map((h) => {
      const time = new Date(h.timestamp).toLocaleString();
      return `[${time}] ${h.type}: ${h.input}\n  → ${h.output}`;
    }).join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onemath-history-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="↻"
        title="Solution History"
        description={`${history.length} saved calculations`}
        gradient="from-teal-500 to-emerald-600"
      />

      {/* Search + Actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted/60 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60 dark:bg-muted/40"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="h-10 w-10 shrink-0"
          title="Export history"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              filterType === t
                ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/25'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-muted/40'
            }`}
          >
            {t === 'All' && <Filter className="w-3 h-3" />}
            {t}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{' '}
          <span className="font-medium text-foreground">{history.length}</span> entries
        </p>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive font-medium transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* History List */}
      <AnimatePresence mode="popLayout">
        {filtered.map((entry, i) => {
          const Icon = typeIcons[entry.type] || Calculator;
          const colorClass = typeColors[entry.type] || typeColors.default;
          const time = new Date(entry.timestamp);

          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
            >
              <Card
                className="hover:shadow-sm hover:border-teal-300/50 dark:hover:border-teal-700/50 transition-all duration-200 cursor-pointer group"
                onClick={() => setTab('solver')}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${colorClass}`}>
                          {entry.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p
                        className="text-sm text-foreground font-medium truncate"
                        style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                      >
                        {entry.input}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.output}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 mt-3 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4 dark:bg-muted/40">
            <Clock className="h-6 w-6 text-muted-foreground/50" />
          </div>
          {history.length === 0 ? (
            <>
              <p className="text-sm font-semibold text-foreground">No history yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start solving problems to build your history</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">No matches found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search or filter</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}