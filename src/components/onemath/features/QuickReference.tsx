'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import KaTeXRenderer from '../KaTeXRenderer';
import FeatureHeader from '../FeatureHeader';

interface RefItem {
  category: string;
  title: string;
  formulas: { tex: string; note?: string }[];
}

const references: RefItem[] = [
  {
    category: 'Algebra',
    title: 'Algebraic Identities',
    formulas: [
      { tex: '(a+b)^2 = a^2 + 2ab + b^2', note: 'Square of sum' },
      { tex: '(a-b)^2 = a^2 - 2ab + b^2', note: 'Square of difference' },
      { tex: 'a^2 - b^2 = (a+b)(a-b)', note: 'Difference of squares' },
      { tex: 'a^3 + b^3 = (a+b)(a^2 - ab + b^2)', note: 'Sum of cubes' },
      { tex: 'a^3 - b^3 = (a-b)(a^2 + ab + b^2)', note: 'Difference of cubes' },
      { tex: '(a+b+c)^2 = a^2+b^2+c^2+2ab+2ac+2bc' },
      { tex: 'x^{2n} - y^{2n} = (x^n - y^n)(x^n + y^n)' },
    ],
  },
  {
    category: 'Algebra',
    title: 'Laws of Exponents',
    formulas: [
      { tex: 'a^m \\cdot a^n = a^{m+n}' },
      { tex: '\\frac{a^m}{a^n} = a^{m-n}' },
      { tex: '(a^m)^n = a^{mn}' },
      { tex: '(ab)^n = a^n b^n' },
      { tex: 'a^{-n} = \\frac{1}{a^n}' },
      { tex: 'a^{1/n} = \\sqrt[n]{a}' },
      { tex: 'a^{0} = 1 \\quad (a \\neq 0)' },
    ],
  },
  {
    category: 'Trigonometry',
    title: 'Trigonometric Identities',
    formulas: [
      { tex: '\\sin^2\\theta + \\cos^2\\theta = 1' },
      { tex: '\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta' },
      { tex: '\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta' },
      { tex: '\\cos(2\\theta) = 2\\cos^2\\theta - 1' },
      { tex: '\\cos(2\\theta) = 1 - 2\\sin^2\\theta' },
      { tex: '\\tan(2\\theta) = \\frac{2\\tan\\theta}{1-\\tan^2\\theta}' },
      { tex: '\\sin\\alpha + \\sin\\beta = 2\\sin\\frac{\\alpha+\\beta}{2}\\cos\\frac{\\alpha-\\beta}{2}' },
      { tex: '\\cos\\alpha + \\cos\\beta = 2\\cos\\frac{\\alpha+\\beta}{2}\\cos\\frac{\\alpha-\\beta}{2}' },
    ],
  },
  {
    category: 'Trigonometry',
    title: 'Sum-to-Product Formulas',
    formulas: [
      { tex: '\\sin A + \\sin B = 2\\sin\\frac{A+B}{2}\\cos\\frac{A-B}{2}' },
      { tex: '\\sin A - \\sin B = 2\\cos\\frac{A+B}{2}\\sin\\frac{A-B}{2}' },
      { tex: '\\cos A + \\cos B = 2\\cos\\frac{A+B}{2}\\cos\\frac{A-B}{2}' },
      { tex: '\\cos A - \\cos B = -2\\sin\\frac{A+B}{2}\\sin\\frac{A-B}{2}' },
      { tex: '\\tan A + \\tan B = \\frac{\\sin(A+B)}{\\cos A\\cos B}' },
    ],
  },
  {
    category: 'Trigonometry',
    title: 'Special Angles',
    formulas: [
      { tex: '\\sin 0°=0,\\; \\sin 30°=\\tfrac{1}{2},\\; \\sin 45°=\\tfrac{\\sqrt{2}}{2},\\; \\sin 60°=\\tfrac{\\sqrt{3}}{2},\\; \\sin 90°=1' },
      { tex: '\\cos 0°=1,\\; \\cos 30°=\\tfrac{\\sqrt{3}}{2},\\; \\cos 45°=\\tfrac{\\sqrt{2}}{2},\\; \\cos 60°=\\tfrac{1}{2},\\; \\cos 90°=0' },
    ],
  },
  {
    category: 'Calculus',
    title: 'Differentiation Rules',
    formulas: [
      { tex: '\\frac{d}{dx}[cf(x)] = c \\cdot f\'(x)', note: 'Constant multiple' },
      { tex: '\\frac{d}{dx}[f(x)+g(x)] = f\'(x)+g\'(x)', note: 'Sum rule' },
      { tex: '\\frac{d}{dx}[f \\cdot g] = f\'g + fg\'', note: 'Product rule' },
      { tex: '\\frac{d}{dx}\\left[\\frac{f}{g}\\right] = \\frac{gf\' - fg\'}{g^2}', note: 'Quotient rule' },
      { tex: '\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)', note: 'Chain rule' },
      { tex: '\\frac{d}{dx}[x^n] = nx^{n-1}' },
      { tex: '\\frac{d}{dx}[e^x] = e^x' },
      { tex: '\\frac{d}{dx}[\\ln x] = \\frac{1}{x}' },
      { tex: '\\frac{d}{dx}[\\sin x] = \\cos x' },
      { tex: '\\frac{d}{dx}[\\cos x] = -\\sin x' },
      { tex: '\\frac{d}{dx}[\\tan x] = \\sec^2 x' },
      { tex: '\\frac{d}{dx}[\\arcsin x] = \\frac{1}{\\sqrt{1-x^2}}' },
    ],
  },
  {
    category: 'Calculus',
    title: 'Integration Formulas',
    formulas: [
      { tex: '\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)' },
      { tex: '\\int \\frac{1}{x}\\,dx = \\ln|x| + C' },
      { tex: '\\int e^x\\,dx = e^x + C' },
      { tex: '\\int \\sin x\\,dx = -\\cos x + C' },
      { tex: '\\int \\cos x\\,dx = \\sin x + C' },
      { tex: '\\int \\sec^2 x\\,dx = \\tan x + C' },
      { tex: '\\int \\frac{1}{1+x^2}\\,dx = \\arctan x + C' },
      { tex: '\\int \\frac{1}{\\sqrt{1-x^2}}\\,dx = \\arcsin x + C' },
      { tex: '\\int a^x\\,dx = \\frac{a^x}{\\ln a} + C' },
    ],
  },
  {
    category: 'Calculus',
    title: "L'Hôpital's Rule & Series",
    formulas: [
      { tex: '\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f\'(x)}{g\'(x)}', note: 'When 0/0 or ∞/∞' },
      { tex: 'e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!}' },
      { tex: '\\sin x = \\sum_{n=0}^{\\infty} \\frac{(-1)^n x^{2n+1}}{(2n+1)!}' },
      { tex: '\\cos x = \\sum_{n=0}^{\\infty} \\frac{(-1)^n x^{2n}}{(2n)!}' },
      { tex: '\\ln(1+x) = \\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1} x^n}{n} \\quad (|x|<1)' },
      { tex: '\\frac{1}{1-x} = \\sum_{n=0}^{\\infty} x^n \\quad (|x|<1)' },
    ],
  },
  {
    category: 'Discrete',
    title: 'Combinatorics',
    formulas: [
      { tex: 'n! = n \\times (n-1) \\times \\cdots \\times 2 \\times 1' },
      { tex: '\\binom{n}{k} = \\frac{n!}{k!(n-k)!}' },
      { tex: 'P(n,k) = \\frac{n!}{(n-k)!} = n(n-1)\\cdots(n-k+1)' },
      { tex: '2^n = \\sum_{k=0}^{n} \\binom{n}{k}', note: 'Binomial theorem' },
      { tex: '\\sum_{k=0}^{n} k = \\frac{n(n+1)}{2}' },
      { tex: '\\sum_{k=0}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}' },
      { tex: '\\sum_{k=0}^{n} k^3 = \\left[\\frac{n(n+1)}{2}\\right]^2' },
    ],
  },
  {
    category: 'Discrete',
    title: 'Number Theory',
    formulas: [
      { tex: '\\gcd(a,b) \\cdot \\mathrm{lcm}(a,b) = |a \\cdot b|' },
      { tex: 'a = bq + r \\implies \\gcd(a,b) = \\gcd(b,r)', note: 'Euclidean algorithm' },
      { tex: '\\phi(n) = n \\prod_{p|n}\\left(1-\\frac{1}{p}\\right)', note: "Euler's totient" },
      { tex: 'a^{\\phi(n)} \\equiv 1 \\pmod{n}', note: "Euler's theorem" },
      { tex: 'a^{p-1} \\equiv 1 \\pmod{p}', note: 'Fermat\'s little theorem' },
      { tex: 'a^2 \\equiv b^2 \\pmod{n} \\implies n|(a-b)(a+b)', note: 'If n is prime' },
    ],
  },
  {
    category: 'Geometry',
    title: '2D Geometry',
    formulas: [
      { tex: 'A_{\\triangle} = \\tfrac{1}{2}bh' },
      { tex: 'A_{\\text{circle}} = \\pi r^2' },
      { tex: 'C_{\\text{circle}} = 2\\pi r' },
      { tex: 'A_{\\text{ellipse}} = \\pi ab' },
      { tex: 'A_{\\text{parallelogram}} = bh' },
      { tex: 'A_{\\text{trapezoid}} = \\tfrac{(a+b)h}{2}' },
      { tex: 'A_{\\text{sector}} = \\tfrac{\\theta}{2} r^2' },
      { tex: 'V_{\\text{sphere}} = \\tfrac{4}{3}\\pi r^3' },
      { tex: 'V_{\\text{cylinder}} = \\pi r^2 h' },
      { tex: 'V_{\\text{cone}} = \\tfrac{1}{3}\\pi r^2 h' },
    ],
  },
  {
    category: 'Linear Algebra',
    title: 'Matrix & Determinants',
    formulas: [
      { tex: '\\det\\begin{pmatrix}a & b \\\\ c & d\\end{pmatrix} = ad - bc' },
      { tex: 'A^{-1} = \\frac{1}{\\det A} \\text{adj}(A)' },
      { tex: '\\text{tr}(AB) = \\text{tr}(BA)' },
      { tex: '\\det(AB) = \\det(A)\\det(B)' },
      { tex: '\\det(A^T) = \\det(A)' },
      { tex: '\\det(A^{-1}) = \\frac{1}{\\det(A)}' },
    ],
  },
];

const categories = ['All', 'Algebra', 'Trigonometry', 'Calculus', 'Discrete', 'Geometry', 'Linear Algebra'];

export default function QuickReference() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [copiedTex, setCopiedTex] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return references;
    return references.filter(r => r.category === activeCategory);
  }, [activeCategory]);

  const totalFormulas = useMemo(() => filtered.reduce((s, r) => s + r.formulas.length, 0), [filtered]);

  const handleCopy = async (tex: string) => {
    try {
      await navigator.clipboard.writeText(tex);
      setCopiedTex(tex);
      setTimeout(() => setCopiedTex(null), 1200);
    } catch { /* noop */ }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="📋"
        title="Quick Reference"
        description={`${totalFormulas} formulas across ${categories.length - 1} topics`}
        gradient="from-purple-500 to-fuchsia-500"
      />

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-purple-500 text-white shadow-sm shadow-purple-500/25'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-muted/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {filtered.map((ref, i) => (
            <motion.div
              key={ref.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
            >
              <Card className="overflow-hidden group hover:shadow-md hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-200">
                <button
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  className="w-full text-left"
                >
                  <CardContent className="p-4 pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-1.5 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800/40">
                          {ref.category}
                        </span>
                        <h4 className="text-sm font-bold text-foreground">{ref.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                          {ref.formulas.length}
                        </span>
                        {expandedIdx === i ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </button>

                <AnimatePresence>
                  {expandedIdx === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {ref.formulas.map((f, fi) => (
                          <div
                            key={fi}
                            className="group/formula relative rounded-xl border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors overflow-hidden"
                          >
                            <div className="p-3">
                              <div className="math-display">
                                <KaTeXRenderer latex={f.tex} className="text-sm" />
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                {f.note && (
                                  <p className="text-[10px] text-muted-foreground">{f.note}</p>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopy(f.tex); }}
                                  className="opacity-0 group-hover/formula:opacity-100 transition-opacity shrink-0 ml-auto p-1 rounded hover:bg-muted/60"
                                >
                                  {copiedTex === f.tex ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}