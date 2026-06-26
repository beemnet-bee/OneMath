'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Copy, Check, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import FeatureHeader from '../FeatureHeader';
import KaTeXRenderer from '../KaTeXRenderer';

interface MathConstant {
  name: string;
  symbol: string;
  value: string;
  latex: string;
  category: string;
  description: string;
}

const constants: MathConstant[] = [
  { name: 'Pi', symbol: 'π', value: '3.14159265358979323846', latex: '\\pi = 3.14159265358979323846\\ldots', category: 'Transcendental', description: 'Ratio of circumference to diameter of a circle' },
  { name: 'Euler\'s Number', symbol: 'e', value: '2.71828182845904523536', latex: 'e = 2.71828182845904523536\\ldots', category: 'Transcendental', description: 'Base of natural logarithm, limit of (1+1/n)ⁿ' },
  { name: 'Golden Ratio', symbol: 'φ', value: '1.61803398874989484820', latex: '\\varphi = \\frac{1+\\sqrt{5}}{2} = 1.618033988749894\\ldots', category: 'Algebraic', description: 'Ratio appearing in nature, art, and Fibonacci sequence' },
  { name: 'Square Root of 2', symbol: '√2', value: '1.41421356237309504880', latex: '\\sqrt{2} = 1.41421356237309504880\\ldots', category: 'Algebraic', description: 'Diagonal of unit square, first known irrational number' },
  { name: 'Square Root of 3', symbol: '√3', value: '1.73205080756887729352', latex: '\\sqrt{3} = 1.73205080756887729352\\ldots', category: 'Algebraic', description: 'Diagonal of unit cube face, height of equilateral triangle' },
  { name: 'Square Root of 5', symbol: '√5', value: '2.23606797749978969640', latex: '\\sqrt{5} = 2.23606797749978969640\\ldots', category: 'Algebraic', description: 'Appears in golden ratio: φ = (1+√5)/2' },
  { name: 'Natural Log of 2', symbol: 'ln 2', value: '0.69314718055994530941', latex: '\\ln 2 = 0.69314718055994530941\\ldots', category: 'Logarithmic', description: 'Fundamental in information theory and entropy' },
  { name: 'Natural Log of 10', symbol: 'ln 10', value: '2.30258509299404568401', latex: '\\ln 10 = 2.30258509299404568401\\ldots', category: 'Logarithmic', description: 'Conversion factor between natural and common log' },
  { name: 'Euler-Mascheroni', symbol: 'γ', value: '0.57721566490153286060', latex: '\\gamma = 0.57721566490153286060\\ldots', category: 'Special', description: 'Limit of harmonic series minus natural log, appears in number theory' },
  { name: 'Apéry\'s Constant', symbol: 'ζ(3)', value: '1.20205690315959428539', latex: '\\zeta(3) = 1.20205690315959428539\\ldots', category: 'Special', description: 'Value of Riemann zeta at 3, proven irrational by Apéry' },
  { name: 'Glaisher-Kinkelin', symbol: 'A', value: '1.28242712910062263687', latex: 'A = 1.28242712910062263687\\ldots', category: 'Special', description: 'Appears in sums of factorials and Barnes G-function' },
  { name: 'Catalan\'s Constant', symbol: 'G', value: '0.91596559417721901505', latex: 'G = 0.91596559417721901505\\ldots', category: 'Special', description: 'Alternating sum of odd reciprocals squared' },
  { name: 'Khinchin\'s Constant', symbol: 'K₀', value: '2.68545200106530644530', latex: 'K_0 = 2.68545200106530644530\\ldots', category: 'Special', description: 'Geometric mean of continued fraction coefficients' },
  { name: 'Feigenbaum α', symbol: 'α', value: '2.50290787509589282228', latex: '\\alpha = 2.50290787509589282228\\ldots', category: 'Dynamics', description: 'Ratio of bifurcation intervals in logistic map' },
  { name: 'Feigenbaum δ', symbol: 'δ', value: '4.66920160910299067185', latex: '\\delta = 4.66920160910299067185\\ldots', category: 'Dynamics', description: 'Universal ratio in period-doubling bifurcations' },
  { name: 'Speed of Light', symbol: 'c', value: '299792458 m/s', latex: 'c = 299\\,792\\,458 \\; \\text{m/s}', category: 'Physical', description: 'Speed of light in vacuum, exact by definition' },
  { name: 'Planck Constant', symbol: 'h', value: '6.62607015×10⁻³⁴ J·s', latex: 'h = 6.62607015 \\times 10^{-34} \\; \\text{J·s}', category: 'Physical', description: 'Quantum of action, fundamental to quantum mechanics' },
  { name: 'Gravitational Constant', symbol: 'G', value: '6.674×10⁻¹¹ m³/(kg·s²)', latex: 'G = 6.674 \\times 10^{-11} \\; \\text{m}^3 \\text{kg}^{-1} \\text{s}^{-2}', category: 'Physical', description: 'Newton\'s gravitational constant' },
  { name: 'Boltzmann Constant', symbol: 'k_B', value: '1.380649×10⁻²³ J/K', latex: 'k_B = 1.380649 \\times 10^{-23} \\; \\text{J/K}', category: 'Physical', description: 'Relates temperature to energy at particle level' },
  { name: 'Avogadro\'s Number', symbol: 'N_A', value: '6.02214076×10²³ /mol', latex: 'N_A = 6.02214076 \\times 10^{23} \\; \\text{mol}^{-1}', category: 'Physical', description: 'Number of particles in one mole of substance' },
];

const categories = ['All', 'Transcendental', 'Algebraic', 'Logarithmic', 'Special', 'Dynamics', 'Physical'];

export default function MathConstants() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return constants.filter((c) => {
      const matchCat = activeCategory === 'All' || c.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.symbol.includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const handleCopy = async (value: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch { /* no-op */ }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="ℂ"
        title="Math Constants"
        description="20 fundamental constants with high precision"
        gradient="from-amber-500 to-orange-500"
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search constants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted/60 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 dark:bg-muted/40"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-muted/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of{' '}
        <span className="font-medium text-foreground">{constants.length}</span> constants
      </p>

      {/* Constants Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + search}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-3"
        >
          {filtered.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <Card className="overflow-hidden group hover:shadow-md hover:border-amber-300/50 dark:hover:border-amber-700/50 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="text-2xl shrink-0 w-8 text-center"
                        style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                      >
                        {c.symbol}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground">{c.name}</h4>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full">
                          {c.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(c.value, i)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
                      title="Copy value"
                    >
                      {copiedIdx === i ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Numeric value */}
                  <div className="bg-muted/50 rounded-lg px-3 py-2 mb-2.5 border border-border/30">
                    <p
                      className="text-sm font-mono text-foreground truncate number-math"
                      style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', 'Times New Roman', serif" }}
                    >
                      {c.value}
                    </p>
                  </div>

                  {/* LaTeX rendering */}
                  <div className="math-display mb-2.5">
                    <KaTeXRenderer latex={c.latex} className="text-sm" />
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No constants found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search or category</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}