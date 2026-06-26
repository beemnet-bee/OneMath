'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useOneMathStore } from '@/stores/onemath-store';

interface FeatureItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  color: string;
  category: CategoryType;
}

type CategoryType = 'Algebra' | 'Calculus' | 'Geometry' | 'Numbers' | 'Tools';

const categories: (CategoryType | 'All')[] = ['All', 'Algebra', 'Calculus', 'Geometry', 'Numbers', 'Tools'];

const categoryIcons: Record<string, string> = {
  'All': '⭐',
  'Algebra': '📐',
  'Calculus': '∫',
  'Geometry': '📏',
  'Numbers': '🔢',
  'Tools': '🧰',
};

const features: FeatureItem[] = [
  { id: 'quadratic', name: 'Quadratic Solver', icon: 'ax²', desc: 'Solve ax²+bx+c=0 with discriminant & vertex', color: 'from-emerald-500 to-teal-500', category: 'Algebra' },
  { id: 'inequality-solver', name: 'Inequality Solver', icon: '≤', desc: 'Linear, quadratic, absolute value', color: 'from-orange-500 to-amber-500', category: 'Algebra' },
  { id: 'linear-systems', name: 'Linear Systems', icon: '行列', desc: '2×2 and 3×3 via Cramer\'s rule', color: 'from-emerald-600 to-green-500', category: 'Algebra' },
  { id: 'polynomial', name: 'Polynomial Tools', icon: 'f(x)', desc: 'Factor, expand, evaluate polynomials', color: 'from-teal-500 to-emerald-500', category: 'Algebra' },
  { id: 'sequences', name: 'Sequences & Series', icon: '🔢', desc: 'Arithmetic, geometric, Fibonacci', color: 'from-green-500 to-lime-500', category: 'Algebra' },
  { id: 'logarithm', name: 'Logarithm', icon: 'log', desc: 'log, ln, exp, change of base', color: 'from-lime-500 to-emerald-500', category: 'Algebra' },
  { id: 'derivative', name: 'Derivative Calc', icon: 'd/dx', desc: 'Symbolic derivatives via AI', color: 'from-red-500 to-orange-500', category: 'Calculus' },
  { id: 'integral', name: 'Integral Calc', icon: '∫', desc: 'Definite & indefinite integrals', color: 'from-orange-500 to-amber-500', category: 'Calculus' },
  { id: 'limit-calc', name: 'Limit Calculator', icon: 'lim', desc: 'Evaluate limits & L\'Hôpital\'s rule', color: 'from-amber-500 to-yellow-500', category: 'Calculus' },
  { id: 'geometry', name: 'Geometry', icon: '📏', desc: 'Area, volume, perimeter for 9 shapes', color: 'from-green-500 to-emerald-500', category: 'Geometry' },
  { id: 'coordinate-geometry', name: 'Coordinate Geometry', icon: '🎯', desc: 'Distance, midpoint, lines & circles', color: 'from-sky-500 to-cyan-500', category: 'Geometry' },
  { id: 'vector-calc', name: 'Vector Calculator', icon: '→', desc: 'Dot & cross product, magnitude', color: 'from-teal-500 to-cyan-500', category: 'Geometry' },
  { id: 'trigonometry', name: 'Trigonometry', icon: '📐', desc: 'All trig functions & unit circle', color: 'from-amber-500 to-orange-500', category: 'Geometry' },
  { id: 'complex-numbers', name: 'Complex Numbers', icon: '∞', desc: 'Add, multiply, modulus, polar', color: 'from-rose-500 to-red-500', category: 'Numbers' },
  { id: 'prime-factorization', name: 'Prime Factorization', icon: '🔢', desc: 'Full factorization & Euler\'s totient', color: 'from-yellow-500 to-amber-500', category: 'Numbers' },
  { id: 'number-base', name: 'Base Converter', icon: '2️⃣', desc: 'Binary, octal, decimal, hex', color: 'from-cyan-500 to-teal-500', category: 'Numbers' },
  { id: 'gcd-lcm', name: 'GCD / LCM', icon: '🧮', desc: 'Euclidean algorithm', color: 'from-violet-500 to-purple-500', category: 'Numbers' },
  { id: 'number-properties', name: 'Number Properties', icon: '🔢', desc: 'Prime, even, Fibonacci, palindrome', color: 'from-amber-500 to-yellow-500', category: 'Numbers' },
  { id: 'binary-ops', name: 'Binary Operations', icon: '01', desc: 'AND, OR, XOR, bit shifts', color: 'from-teal-500 to-green-500', category: 'Numbers' },
  { id: 'roman-numeral', name: 'Roman Numerals', icon: 'Ⅳ', desc: 'Roman ↔ Arabic conversion', color: 'from-rose-500 to-pink-500', category: 'Numbers' },
  { id: 'scientific-calc', name: 'Scientific Calculator', icon: '🧪', desc: 'Full scientific calculator', color: 'from-emerald-500 to-teal-500', category: 'Tools' },
  { id: 'matrix-calc', name: 'Matrix Calculator', icon: '🔢', desc: 'Det, inverse, transpose, rank', color: 'from-green-500 to-emerald-600', category: 'Tools' },
  { id: 'statistics', name: 'Statistics', icon: '📊', desc: 'Mean, median, mode, std dev', color: 'from-purple-500 to-pink-500', category: 'Tools' },
  { id: 'probability', name: 'Probability', icon: '🎲', desc: 'Permutations, combinations, binomial', color: 'from-pink-500 to-rose-500', category: 'Tools' },
  { id: 'percentage', name: 'Percentage', icon: '%', desc: 'All percentage operations', color: 'from-lime-500 to-green-500', category: 'Tools' },
  { id: 'unit-converter', name: 'Unit Converter', icon: '🔄', desc: 'Length, weight, temp, area', color: 'from-emerald-500 to-lime-500', category: 'Tools' },
  { id: 'latex-renderer', name: 'LaTeX Renderer', icon: '𝐿', desc: 'Input and render LaTeX code', color: 'from-gray-500 to-slate-500', category: 'Tools' },
  { id: 'practice', name: 'Practice Mode', icon: '∞', desc: 'Random problems with scoring', color: 'from-emerald-500 to-green-500', category: 'Tools' },
  { id: 'flashcards', name: 'Math Flashcards', icon: '🃏', desc: 'Study with spaced repetition', color: 'from-fuchsia-500 to-pink-500', category: 'Tools' },
  { id: 'constants', name: 'Math Constants', icon: 'ℂ', desc: '20 fundamental constants', color: 'from-amber-500 to-orange-500', category: 'Tools' },
  { id: 'history-panel', name: 'Solution History', icon: '↻', desc: 'Search, filter, export', color: 'from-teal-500 to-emerald-600', category: 'Tools' },
  { id: 'quick-ref', name: 'Quick Reference', icon: '📋', desc: '50+ formulas cheat sheet', color: 'from-purple-500 to-fuchsia-500', category: 'Tools' },
  { id: 'number-theory', name: 'Number Theory', icon: 'ℤ', desc: 'Sieve, totient, modular', color: 'from-cyan-500 to-teal-600', category: 'Tools' },
  { id: 'scratchpad', name: 'Math Scratchpad', icon: '📝', desc: 'Live-evaluation workspace', color: 'from-emerald-500 to-cyan-500', category: 'Tools' },
  { id: 'fractions', name: 'Fraction Calculator', icon: '½', desc: 'Visual fraction arithmetic', color: 'from-amber-500 to-yellow-500', category: 'Tools' },
  { id: 'equation-balancer', name: 'Equation Balancer', icon: '⚖', desc: 'Step-by-step solving', color: 'from-orange-500 to-red-500', category: 'Tools' },
  { id: 'set-theory', name: 'Set Theory', icon: '⊕', desc: 'Venn diagrams & operations', color: 'from-blue-500 to-cyan-500', category: 'Algebra' },
  { id: 'financial-calc', name: 'Financial Calc', icon: '💰', desc: 'Interest, loans, ROI', color: 'from-emerald-500 to-green-500', category: 'Tools' },
  { id: 'curve-plotter', name: 'Curve Plotter', icon: '🌀', desc: 'Parametric & polar curves', color: 'from-violet-500 to-purple-500', category: 'Geometry' },
  { id: 'truth-table', name: 'Truth Table', icon: '⊞', desc: 'Boolean logic truth tables', color: 'from-indigo-500 to-violet-500', category: 'Algebra' },
  { id: 'regression', name: 'Regression Calc', icon: '📈', desc: 'Linear, quadratic, exponential fit', color: 'from-rose-500 to-pink-500', category: 'Tools' },
  { id: 'taylor-series', name: 'Taylor Series', icon: 'Σ', desc: 'Series approximations & plots', color: 'from-amber-500 to-orange-500', category: 'Calculus' },
  { id: 'unit-circle', name: 'Unit Circle', icon: '⊙', desc: 'Interactive trig visualization', color: 'from-amber-500 to-orange-500', category: 'Geometry' },
  { id: 'matrix-transform', name: 'Matrix Transforms', icon: '⊗', desc: 'Visualize 2D transformations', color: 'from-teal-500 to-cyan-500', category: 'Algebra' },
  { id: 'function-compare', name: 'Function Compare', icon: '∝', desc: 'Plot & compare functions', color: 'from-violet-500 to-purple-500', category: 'Tools' },
];

export default function MoreFeatures() {
  const { setFeature } = useOneMathStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'All'>('All');

  const filtered = useMemo(() => {
    return features.filter((f) => {
      const matchesCategory = activeCategory === 'All' || f.category === activeCategory;
      const query = search.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        f.name.toLowerCase().includes(query) ||
        f.desc.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const hasFilter = search.trim() !== '' || activeCategory !== 'All';

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-foreground tracking-tight">All Features</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Showing <span className="font-bold text-foreground">{filtered.length}</span> of{' '}
          <span className="font-bold text-foreground">{features.length}</span> tools
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
        <div className="relative">
          <input
            type="text"
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-2xl bg-muted/50 border border-border/80 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-card dark:bg-muted/30 dark:focus:bg-muted/50"
          />
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const count = cat === 'All' ? features.length : features.filter(f => f.category === cat).length;
          return (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat)}
              className={`
                shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-muted/30 border border-transparent hover:border-border/50'
                }
              `}
            >
              <span className="text-sm">{categoryIcons[cat]}</span>
              {cat}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-muted dark:bg-muted/50'}`}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Feature Grid or Empty State */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 dark:bg-muted/30">
              <SlidersHorizontal className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">No tools found</p>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-[200px]">Try adjusting your search or category filter</p>
            {hasFilter && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSearch(''); setActiveCategory('All'); }}
                className="mt-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg"
              >
                Clear filters
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-2 gap-3"
          >
            {filtered.map((f, i) => (
              <motion.button
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: Math.min(i * 0.02, 0.4),
                  duration: 0.3,
                  ease: 'easeOut',
                }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setFeature(f.id)}
                className="block text-left"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-200 group overflow-hidden bg-card/90 backdrop-blur-sm border border-border/50 hover:border-emerald-400/40 dark:hover:border-emerald-600/40 relative card-border-hover">
                  {/* Accent top border */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${f.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <CardContent className="p-3.5 flex flex-col gap-2.5 relative">
                    {/* Icon with subtle background */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white text-sm font-bold shadow-md relative overflow-hidden`}
                      >
                        <span className="relative z-10">{f.icon}</span>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                      </div>
                      <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider mt-1">
                        {f.category}
                      </span>
                    </div>

                    {/* Text */}
                    <div className="min-h-[2.5rem]">
                      <h3 className="text-[13px] font-bold text-foreground leading-tight">
                        {f.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {f.desc}
                      </p>
                    </div>

                    {/* Open indicator */}
                    <div className="flex items-center justify-end mt-auto -mb-1">
                      <motion.span
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1"
                      >
                        Open
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </motion.span>
                    </div>
                  </CardContent>
                </Card>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}