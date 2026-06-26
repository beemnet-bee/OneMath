'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  LineChart,
  BookOpen,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Grid3X3,
  Sigma,
  Copy,
  Check,
  Shuffle,
  Lightbulb,
  Wrench,
  BookMarked,
  Cpu,
  Footprints,
  Target,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useOneMathStore } from '@/stores/onemath-store';
import KaTeXRenderer from './KaTeXRenderer';

/* ──────────────────── Data ──────────────────── */

const quickActions = [
  { icon: Calculator, label: 'Solve Equation', tab: 'solver' as const, gradient: 'from-emerald-500 to-teal-600', desc: 'Step-by-step AI', accent: 'shadow-emerald-500/20' },
  { icon: LineChart, label: 'Graph Function', tab: 'graph' as const, gradient: 'from-amber-500 to-orange-500', desc: 'Visualize plots', accent: 'shadow-amber-500/20' },
  { icon: BookOpen, label: 'Browse Formulas', tab: 'formulas' as const, gradient: 'from-rose-500 to-pink-600', desc: '100+ formulas', accent: 'shadow-rose-500/20' },
  { icon: Grid3X3, label: 'All Features', tab: 'more' as const, gradient: 'from-violet-500 to-fuchsia-600', desc: '45 math tools', accent: 'shadow-violet-500/20' },
];

const featuredFeatures = [
  { id: 'scientific-calc', name: 'Scientific Calc', icon: '🧪', desc: 'Full-featured', color: 'from-emerald-500 to-teal-500' },
  { id: 'matrix-calc', name: 'Matrix', icon: '🔢', desc: 'Det, inverse, rank', color: 'from-green-500 to-emerald-500' },
  { id: 'statistics', name: 'Statistics', icon: '📊', desc: 'Mean, std dev', color: 'from-purple-500 to-pink-500' },
  { id: 'calculus', name: 'Calculus', icon: '∫', desc: 'Deriv & integrals', color: 'from-red-500 to-orange-500' },
  { id: 'flashcards', name: 'Flashcards', icon: '🃏', desc: 'Spaced repetition', color: 'from-fuchsia-500 to-pink-500' },
  { id: 'coordinate-geometry', name: 'Coord. Geometry', icon: '🎯', desc: 'Lines, circles', color: 'from-sky-500 to-cyan-500' },
];

const allFormulas = [
  'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
  '\\int_0^1 x^2\\,dx = \\frac{1}{3}',
  '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
  'e^{i\\pi} + 1 = 0',
  '\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}',
  '\\oint_C \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}',
  'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}\\, e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}',
  '\\det(A) = \\sum_{\\sigma \\in S_n} \\text{sgn}(\\sigma) \\prod_{i=1}^n a_{i,\\,\\sigma(i)}',
];

const tipsOfTheDay = [
  'Use the quadratic formula discriminant Δ = b² − 4ac to quickly determine if roots are real or complex.',
  'To check if a large number is divisible by 3, sum its digits. If the sum is divisible by 3, so is the number.',
  'Euler\'s identity e^(iπ) + 1 = 0 connects five fundamental constants: e, i, π, 1, and 0.',
  'The derivative of sin(x) is cos(x), and the derivative of cos(x) is −sin(x). These cycle endlessly!',
  'For integration by parts, remember LIATE: Logarithmic, Inverse trig, Algebraic, Trig, Exponential — pick u first.',
  'A matrix is invertible if and only if its determinant is non-zero.',
  'The sum of interior angles of any n-sided polygon is (n−2) × 180°.',
  'Fibonacci numbers appear everywhere: flower petals, pinecones, galaxies. Each number is the sum of the two before it.',
];

const heroStats = [
  { label: '45+ Tools', icon: Wrench },
  { label: '100+ Formulas', icon: BookMarked },
  { label: 'AI Powered', icon: Cpu },
  { label: 'Step-by-step', icon: Footprints },
];

const floatingSymbols = ['∫', 'π', 'Σ', '∞', '√', 'Δ', 'θ', 'λ', '∂', '∇'];

/* ──────────────────── Animation Variants ──────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
};

const cardHover = {
  scale: 1.02,
  transition: { type: 'spring', stiffness: 500, damping: 25 },
};

/* ──────────────────── Helpers ──────────────────── */

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ──────────────────── Component ──────────────────── */

export default function HomeScreen() {
  const { setTab, setFeature, history } = useOneMathStore();

  const [displayedFormulas, setDisplayedFormulas] = useState(() => shuffleArray(allFormulas).slice(0, 4));
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [tip] = useState(() => tipsOfTheDay[Math.floor(Math.random() * tipsOfTheDay.length)]);

  const handleShuffle = useCallback(() => {
    setDisplayedFormulas(shuffleArray(allFormulas).slice(0, 4));
  }, []);

  const handleCopy = useCallback(async (latex: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    } catch {
      // Fallback — no-op in environments without clipboard
    }
  }, []);

  const formulaKeys = useMemo(
    () => displayedFormulas.map((f) => f.slice(0, 20)),
    [displayedFormulas],
  );

  return (
    <motion.div
      className="px-4 py-4 space-y-7 pb-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ═══════════════ HERO ═══════════════ */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-6 text-white hero-gradient noise-bg"
      >
        {/* ── Decorative grid pattern ── */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* ── Animated gradient orbs ── */}
        <motion.div
          className="absolute -top-16 -right-16 w-52 h-52 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          }}
          animate={{ x: [0, 12, -8, 0], y: [0, -10, 6, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
          }}
          animate={{ x: [0, -10, 8, 0], y: [0, 8, -6, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          }}
          animate={{ y: [0, -12, 4, 0], scale: [1, 1.15, 0.9, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ── Floating math symbols ── */}
        {floatingSymbols.map((sym, i) => (
          <motion.span
            key={sym + i}
            className="absolute text-white/10 font-bold select-none pointer-events-none"
            style={{
              top: `${12 + (i * 37) % 72}%`,
              left: `${8 + (i * 23) % 78}%`,
              fontSize: `${0.8 + (i % 3) * 0.4}rem`,
            }}
            animate={{ y: [0, -10, 0], opacity: [0.08, 0.18, 0.08], rotate: [0, (i % 2 === 0 ? 5 : -5), 0] }}
            transition={{ duration: 3.5 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          >
            {sym}
          </motion.span>
        ))}

        {/* ── Hero content ── */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </motion.div>
            <span className="text-[11px] font-semibold text-emerald-100 tracking-wider uppercase">
              AI-Powered
            </span>
          </div>
          <h2 className="text-[26px] font-extrabold mb-1.5 tracking-tight leading-tight">
            Welcome to OneMath
          </h2>
          <p className="text-emerald-100/85 text-sm mb-5 leading-relaxed max-w-[320px]">
            Your comprehensive math assistant. Solve, graph, and learn with 45+ powerful tools.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTab('solver')}
              className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-900/20"
            >
              <Zap className="w-4 h-4" /> Start Solving
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTab('formulas')}
              className="inline-flex items-center gap-1.5 text-emerald-100 hover:text-white text-sm font-medium transition-colors bg-white/10 px-3.5 py-2.5 rounded-xl backdrop-blur-sm"
            >
              <Sigma className="w-4 h-4" /> Formulas
            </motion.button>
          </div>

          {/* ── Stats row ── */}
          <div className="mt-5 flex flex-wrap gap-2">
            {heroStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.span
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-[11px] font-medium px-2.5 py-1 rounded-full border border-white/10"
                >
                  <Icon className="w-3 h-3" />
                  {stat.label}
                </motion.span>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════ QUICK ACTIONS ═══════════════ */}
      <motion.section variants={itemVariants}>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Brain className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          </div>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.tab}
                variants={itemVariants}
                whileHover={cardHover}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTab(action.tab)}
                className={`relative flex items-center gap-3 p-4 rounded-2xl border border-border/80 overflow-hidden group transition-all hover:border-emerald-300/60 dark:hover:border-emerald-700/60 hover:shadow-lg ${action.accent} bg-card`}
              >
                {/* Subtle gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300`}
                />

                <div
                  className={`relative w-11 h-11 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center text-white shrink-0 shadow-md overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                  <Icon className="w-5 h-5 relative z-10" />
                </div>

                <div className="relative text-left min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-foreground truncate">
                    {action.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {action.desc}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 relative ml-auto shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* ═══════════════ DAILY FORMULAS ═══════════════ */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Sigma className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            </div>
            Daily Formulas
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShuffle}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors bg-muted/50 px-2.5 py-1 rounded-lg"
          >
            <Shuffle className="w-3 h-3" /> Random
          </motion.button>
        </div>

        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {displayedFormulas.map((tex, i) => (
              <motion.div
                key={formulaKeys[i]}
                layout
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30, delay: i * 0.04 }}
              >
                <Card className="formula-card overflow-hidden card-lift border-border/60 hover:border-emerald-300/50 dark:hover:border-emerald-700/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-2">
                    <div
                      className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-hide py-1"
                      style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', 'Cambria Math', serif" }}
                    >
                      <KaTeXRenderer latex={tex} className="text-sm sm:text-base" />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCopy(tex, i)}
                      className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                      aria-label="Copy formula"
                    >
                      {copiedIdx === i ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-3.5 h-3.5 text-emerald-500" /></motion.div>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </motion.button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </motion.section>

      {/* ═══════════════ FEATURED TOOLS ═══════════════ */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Target className="w-3 h-3 text-violet-600 dark:text-violet-400" />
            </div>
            Featured Tools
          </h3>
          <button
            onClick={() => setTab('more')}
            className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-0.5"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {featuredFeatures.map((f, i) => (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 400, damping: 28 }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFeature(f.id)}
              className="relative flex flex-col items-center p-3.5 bg-card border border-border/60 rounded-2xl hover:border-emerald-400/40 dark:hover:border-emerald-600/40 transition-all duration-200 group overflow-hidden card-lift hover:shadow-lg"
            >
              {/* Hover gradient glow */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${f.color} group-hover:opacity-[0.06]`} />

              <motion.span
                className="relative text-2xl mb-1.5"
                whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.3 }}
              >
                {f.icon}
              </motion.span>
              <span className="relative text-[11px] font-bold text-foreground text-center leading-tight">
                {f.name}
              </span>
              <span className="relative text-[9px] text-muted-foreground text-center mt-0.5 leading-snug">
                {f.desc}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════ TIP OF THE DAY ═══════════════ */}
      <motion.section variants={itemVariants}>
        <Card className="border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/50 dark:from-amber-950/20 dark:via-card dark:to-emerald-950/10 overflow-hidden card-lift">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <motion.div
                className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20"
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
              >
                <Lightbulb className="w-5 h-5 text-white" />
              </motion.div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Tip of the Day
                  </p>
                  <Layers className="w-3 h-3 text-amber-500/60" />
                </div>
                <p className="text-[13px] text-foreground/75 dark:text-foreground/65 leading-relaxed">
                  {tip}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ═══════════════ RECENT HISTORY ═══════════════ */}
      {history.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              </div>
              Recent Problems
            </h3>
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full font-medium">
              {history.length} saved
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {history.slice(0, 3).map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:border-emerald-300/50 dark:hover:border-emerald-700/50 transition-all hover:shadow-md bg-card/80 backdrop-blur-sm"
                  onClick={() => setTab('solver')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                        {entry.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p
                      className="text-sm text-foreground font-medium truncate"
                      style={{
                        fontFamily:
                          "'Latin Modern Math', 'STIX Two Math', 'Cambria Math', serif",
                      }}
                    >
                      {entry.input}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {entry.output}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}