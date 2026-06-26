'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calculator, LineChart, BookOpen, Grid3X3, X, Moon, Sun, Keyboard } from 'lucide-react';
import { useOneMathStore, type TabId } from '@/stores/onemath-store';
import { useTheme } from 'next-themes';

const tabs: { id: TabId; icon: React.ElementType; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'solver', icon: Calculator, label: 'Solver' },
  { id: 'graph', icon: LineChart, label: 'Graph' },
  { id: 'formulas', icon: BookOpen, label: 'Formulas' },
  { id: 'more', icon: Grid3X3, label: 'More' },
];

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  const { activeTab, setTab, activeFeature, history, goBack } = useOneMathStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const mounted = resolvedTheme !== undefined;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showShortcuts && e.key === 'Escape') {
        setShowShortcuts(false);
        return;
      }
      if (activeFeature && e.key === 'Escape') {
        goBack();
        return;
      }
      const tabKeys: Record<string, TabId> = { '1': 'home', '2': 'solver', '3': 'graph', '4': 'formulas', '5': 'more' };
      if (tabKeys[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setTab(tabKeys[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, activeFeature, goBack, setTab]);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 glass-v9 border-b border-border/15 shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/25 cursor-pointer relative overflow-hidden ripple-effect"
            whileHover={{ scale: 1.08, rotate: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab('home')}
          >
            <span
              className="text-white font-bold text-base relative z-10"
              style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
            >
              ∑
            </span>
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none" />
          </motion.div>
          <div className="select-none">
            <h1 className="text-[15px] font-extrabold text-foreground leading-none tracking-tight">
              One<span className="text-emerald-500">Math</span>
            </h1>
            <p className="text-[9px] text-muted-foreground leading-none mt-0.5 tracking-widest uppercase font-medium">
              AI Math Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {history.length > 0 && !activeFeature && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setTab('home')}
              className="relative text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1.5 rounded-lg hover:bg-muted/60 transition-colors flex items-center gap-1"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="absolute -top-1 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center">
                {history.length > 9 ? '9+' : history.length}
              </span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="text-xs text-muted-foreground hover:text-foreground font-medium p-2 rounded-lg hover:bg-muted/60 transition-colors"
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08, rotate: 15 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="text-xs text-muted-foreground hover:text-foreground font-medium p-2 rounded-lg hover:bg-muted/60 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </motion.button>
          {activeFeature && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={goBack}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-[11px]">Back</span>
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-card border border-border/40 rounded-2xl shadow-2xl p-5 w-full max-w-sm space-y-4 card-stack"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Keyboard Shortcuts</h3>
                <button onClick={() => setShowShortcuts(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { key: '1', desc: 'Home tab' },
                  { key: '2', desc: 'Solver tab' },
                  { key: '3', desc: 'Graph tab' },
                  { key: '4', desc: 'Formulas tab' },
                  { key: '5', desc: 'More tab' },
                  { key: 'Esc', desc: 'Go back / Close modal' },
                  { key: 'Ctrl+Enter', desc: 'Solve equation' },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4 py-1">
                    <span className="text-muted-foreground text-xs">{desc}</span>
                    <kbd className="text-[10px] font-mono bg-muted/80 px-2.5 py-1 rounded-lg border border-border/60 shadow-sm font-medium tabular-nums">{key}</kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (activeFeature || '')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="min-h-[calc(100vh-120px)] pb-24"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-v9 border-t border-border/15 shadow-[0_-4px_20px_oklch(0_0_0/0.05)] dark:shadow-[0_-4px_20px_oklch(0_0_0/0.2)]">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id && !activeFeature;
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => setTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[52px] relative ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-x-2 -top-1.5 h-[3px] rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 neon-glow"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <motion.div
                  className="relative"
                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Icon
                    className="w-5 h-5 relative z-10 transition-all duration-200"
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="nav-icon-bg"
                      className="absolute -inset-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </motion.div>
                <span className={`text-[10px] relative z-10 transition-all duration-200 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
        {/* Safe area for mobile */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}