'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FeatureHeader from '@/components/onemath/FeatureHeader';
import KaTeXRenderer from '@/components/onemath/KaTeXRenderer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Layers,
  RotateCcw,
  ChevronRight,
  Plus,
  Trophy,
  Target,
  XCircle,
  CheckCircle2,
  ThumbsUp,
  Sparkles,
  BookOpen,
} from 'lucide-react';

/* ═══════════════════════ Types ═══════════════════════ */

interface FlashCard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: number;
}

type Rating = 'again' | 'hard' | 'good' | 'easy';
type SessionPhase = 'select' | 'study' | 'summary';

/* ═══════════════════════ Card Decks ═══════════════════════ */

const CATEGORY_COLORS: Record<string, string> = {
  Algebra: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
  Trigonometry: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25',
  Calculus: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25',
  Geometry: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25',
  'Number Theory': 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25',
  Custom: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
};

const CATEGORY_ICONS: Record<string, string> = {
  Algebra: 'x²',
  Trigonometry: 'θ',
  Calculus: '∫',
  Geometry: '△',
  'Number Theory': 'ℙ',
  Custom: '✎',
};

function makeCard(front: string, back: string, category: string, difficulty = 1): FlashCard {
  return {
    id: `card-${category}-${front.slice(0, 12).replace(/\s/g, '_')}-${Math.random().toString(36).slice(2, 6)}`,
    front,
    back,
    category,
    difficulty,
  };
}

const ALGEBRA_DECK: FlashCard[] = [
  makeCard('Quadratic Formula', 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', 'Algebra', 1),
  makeCard('Difference of Squares', 'a^2 - b^2 = (a+b)(a-b)', 'Algebra', 1),
  makeCard('Binomial Theorem', '(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k', 'Algebra', 2),
  makeCard('Log Product Rule', '\\log(ab) = \\log a + \\log b', 'Algebra', 1),
  makeCard('Log Quotient Rule', '\\log\\left(\\frac{a}{b}\\right) = \\log a - \\log b', 'Algebra', 1),
  makeCard('Log Power Rule', '\\log(a^n) = n \\cdot \\log a', 'Algebra', 1),
  makeCard('Change of Base', '\\log_b a = \\frac{\\ln a}{\\ln b}', 'Algebra', 2),
  makeCard('Exponent Product Rule', 'a^m \\cdot a^n = a^{m+n}', 'Algebra', 1),
  makeCard('Exponent Quotient Rule', '\\frac{a^m}{a^n} = a^{m-n}', 'Algebra', 1),
  makeCard('Negative Exponent', 'a^{-n} = \\frac{1}{a^n}', 'Algebra', 1),
  makeCard('Perfect Square Trinomial', '(a \\pm b)^2 = a^2 \\pm 2ab + b^2', 'Algebra', 1),
  makeCard('Sum of Cubes', 'a^3 + b^3 = (a+b)(a^2 - ab + b^2)', 'Algebra', 2),
];

const TRIG_DECK: FlashCard[] = [
  makeCard('Pythagorean Identity', '\\sin^2\\theta + \\cos^2\\theta = 1', 'Trigonometry', 1),
  makeCard('Double Angle (sin)', '\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta', 'Trigonometry', 1),
  makeCard('Double Angle (cos)', '\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta', 'Trigonometry', 1),
  makeCard('Half Angle (sin)', '\\sin\\frac{\\theta}{2} = \\pm\\sqrt{\\frac{1-\\cos\\theta}{2}}', 'Trigonometry', 2),
  makeCard('Half Angle (cos)', '\\cos\\frac{\\theta}{2} = \\pm\\sqrt{\\frac{1+\\cos\\theta}{2}}', 'Trigonometry', 2),
  makeCard('Sum of Angles (sin)', '\\sin(\\alpha+\\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta', 'Trigonometry', 2),
  makeCard('Law of Sines', '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}', 'Trigonometry', 2),
  makeCard('Law of Cosines', 'c^2 = a^2 + b^2 - 2ab\\cos C', 'Trigonometry', 2),
  makeCard('Tangent Identity', '\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}', 'Trigonometry', 1),
  makeCard('Tangent Double Angle', '\\tan(2\\theta) = \\frac{2\\tan\\theta}{1 - \\tan^2\\theta}', 'Trigonometry', 2),
  makeCard('Reciprocal Identities', '\\csc\\theta = \\frac{1}{\\sin\\theta}, \\; \\sec\\theta = \\frac{1}{\\cos\\theta}, \\; \\cot\\theta = \\frac{1}{\\tan\\theta}', 'Trigonometry', 1),
  makeCard('Sum-to-Product (sin)', '\\sin A + \\sin B = 2\\sin\\frac{A+B}{2}\\cos\\frac{A-B}{2}', 'Trigonometry', 3),
];

const CALCULUS_DECK: FlashCard[] = [
  makeCard('Power Rule (Derivative)', '\\frac{d}{dx}\\,x^n = nx^{n-1}', 'Calculus', 1),
  makeCard('Product Rule', '\\frac{d}{dx}[fg] = f\\,g\' + g\\,f\'', 'Calculus', 1),
  makeCard('Quotient Rule', '\\frac{d}{dx}\\left[\\frac{f}{g}\\right] = \\frac{gf\' - fg\'}{g^2}', 'Calculus', 2),
  makeCard('Chain Rule', '\\frac{d}{dx}f(g(x)) = f\'(g(x)) \\cdot g\'(x)', 'Calculus', 1),
  makeCard('Fundamental Theorem (Part 1)', '\\frac{d}{dx}\\int_a^x f(t)\\,dt = f(x)', 'Calculus', 2),
  makeCard('Fundamental Theorem (Part 2)', '\\int_a^b f(x)\\,dx = F(b) - F(a)', 'Calculus', 2),
  makeCard('Derivative of eˣ', '\\frac{d}{dx}e^x = e^x', 'Calculus', 1),
  makeCard('Derivative of ln x', '\\frac{d}{dx}\\ln x = \\frac{1}{x}', 'Calculus', 1),
  makeCard('Derivative of sin x', '\\frac{d}{dx}\\sin x = \\cos x', 'Calculus', 1),
  makeCard('Power Rule (Integral)', '\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)', 'Calculus', 1),
  makeCard('Integral of 1/x', '\\int \\frac{1}{x}\\,dx = \\ln|x| + C', 'Calculus', 1),
  makeCard('Integral of eˣ', '\\int e^x\\,dx = e^x + C', 'Calculus', 1),
  makeCard("L'Hôpital's Rule", '\\lim_{x \\to a}\\frac{f(x)}{g(x)} = \\lim_{x \\to a}\\frac{f\'(x)}{g\'(x)}', 'Calculus', 2),
];

const GEOMETRY_DECK: FlashCard[] = [
  makeCard('Area of a Circle', 'A = \\pi r^2', 'Geometry', 1),
  makeCard('Circumference of a Circle', 'C = 2\\pi r', 'Geometry', 1),
  makeCard('Volume of a Sphere', 'V = \\frac{4}{3}\\pi r^3', 'Geometry', 1),
  makeCard('Volume of a Cylinder', 'V = \\pi r^2 h', 'Geometry', 1),
  makeCard('Volume of a Cone', 'V = \\frac{1}{3}\\pi r^2 h', 'Geometry', 1),
  makeCard('Pythagorean Theorem', 'a^2 + b^2 = c^2', 'Geometry', 1),
  makeCard('Distance Formula', 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}', 'Geometry', 1),
  makeCard('Area of a Triangle', 'A = \\frac{1}{2}bh', 'Geometry', 1),
  makeCard('Area of a Trapezoid', 'A = \\frac{1}{2}(b_1 + b_2)h', 'Geometry', 1),
  makeCard('Surface Area of a Sphere', 'S = 4\\pi r^2', 'Geometry', 2),
  makeCard('Area of an Ellipse', 'A = \\pi a b', 'Geometry', 2),
  makeCard('Volume of a Pyramid', 'V = \\frac{1}{3}Bh', 'Geometry', 2),
];

const NUMBER_THEORY_DECK: FlashCard[] = [
  makeCard("Fermat's Little Theorem", 'a^p \\equiv a \\pmod{p}', 'Number Theory', 2),
  makeCard("Fermat's Little Theorem (alt)", 'a^{p-1} \\equiv 1 \\pmod{p} \\quad (a \\not\\equiv 0)', 'Number Theory', 3),
  makeCard("Euler's Totient Formula", '\\phi(n) = n \\prod_{p|n}\\left(1 - \\frac{1}{p}\\right)', 'Number Theory', 3),
  makeCard('Prime Number Theorem', '\\pi(x) \\sim \\frac{x}{\\ln x}', 'Number Theory', 3),
  makeCard('Euler\'s Theorem', 'a^{\\phi(n)} \\equiv 1 \\pmod{n}', 'Number Theory', 3),
  makeCard('Chinese Remainder Theorem', 'x \\equiv a_1 \\pmod{m_1},\\; x \\equiv a_2 \\pmod{m_2} \\; \\Rightarrow \\; \\text{unique mod } \\mathrm{lcm}(m_1, m_2)', 'Number Theory', 3),
  makeCard('Modular Exponentiation', 'a^b \\bmod n = \\prod (a^{2^i})^{b_i} \\bmod n', 'Number Theory', 2),
  makeCard('Sum of Divisors Function', '\\sigma(n) = \\sum_{d|n} d', 'Number Theory', 2),
  makeCard('Number of Divisors', 'd(n) = \\prod (e_i + 1) \\text{ for } n = \\prod p_i^{e_i}', 'Number Theory', 2),
  makeCard('Wilson\'s Theorem', '(p-1)! \\equiv -1 \\pmod{p} \\iff p \\text{ is prime}', 'Number Theory', 3),
  makeCard('Quadratic Reciprocity', '\\left(\\frac{p}{q}\\right)\\left(\\frac{q}{p}\\right) = (-1)^{\\frac{p-1}{2}\\cdot\\frac{q-1}{2}}', 'Number Theory', 3),
];

const ALL_DECKS: Record<string, FlashCard[]> = {
  Algebra: ALGEBRA_DECK,
  Trigonometry: TRIG_DECK,
  Calculus: CALCULUS_DECK,
  Geometry: GEOMETRY_DECK,
  'Number Theory': NUMBER_THEORY_DECK,
};

const CATEGORY_LIST = Object.keys(ALL_DECKS);

/* ═══════════════════════ Helpers ═══════════════════════ */

const FONT_STYLE = { fontFamily: "'Latin Modern Math', 'STIX Two Math', 'Cambria Math', serif" };

const RATING_CONFIG: { key: Rating; label: string; color: string; icon: React.ReactNode }[] = [
  { key: 'again', label: 'Again', color: 'bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 border-red-500/20', icon: <RotateCcw className="w-3.5 h-3.5" /> },
  { key: 'hard', label: 'Hard', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border-amber-500/20', icon: <Target className="w-3.5 h-3.5" /> },
  { key: 'good', label: 'Good', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/20', icon: <ThumbsUp className="w-3.5 h-3.5" /> },
  { key: 'easy', label: 'Easy', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25 border-sky-500/20', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ═══════════════════════ Custom Card Storage ═══════════════════════ */

const STORAGE_KEY = 'onemath-custom-flashcards';

function loadCustomCards(): FlashCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomCards(cards: FlashCard[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

/* ═══════════════════════ Component ═══════════════════════ */

export default function MathFlashcards() {
  /* ─── State ─── */
  const [phase, setPhase] = useState<SessionPhase>('select');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [queue, setQueue] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, correct: 0, total: 0 });
  const [customCards, setCustomCards] = useState<FlashCard[]>(() => loadCustomCards());
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ─── Custom card inputs ─── */
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newCategory, setNewCategory] = useState('Algebra');

  /* ─── Build available deck list ─── */
  const allCards = useMemo(() => {
    const built: FlashCard[] = [];
    for (const cat of CATEGORY_LIST) {
      built.push(...ALL_DECKS[cat]);
    }
    built.push(...customCards);
    return built;
  }, [customCards]);

  const deckCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allCards.length };
    for (const cat of CATEGORY_LIST) {
      counts[cat] = (ALL_DECKS[cat] || []).length + customCards.filter((c) => c.category === cat).length;
    }
    counts['Custom'] = customCards.length;
    return counts;
  }, [allCards, customCards]);

  /* ─── Start session ─── */
  const startSession = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      let cards: FlashCard[];
      if (category === 'All') {
        cards = shuffleArray(allCards);
      } else if (category === 'Custom') {
        cards = shuffleArray(customCards);
      } else {
        const catCards = (ALL_DECKS[category] || []).concat(customCards.filter((c) => c.category === category));
        cards = shuffleArray(catCards);
      }
      if (cards.length === 0) return;
      setQueue(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setStats({ reviewed: 0, correct: 0, total: cards.length });
      setPhase('study');
    },
    [allCards, customCards]
  );

  /* ─── Rating handler (spaced repetition) ─── */
  const handleRating = useCallback(
    (rating: Rating) => {
      if (currentIndex >= queue.length) return;
      const newQueue = [...queue];
      const card = newQueue[currentIndex];
      const isCorrect = rating === 'good' || rating === 'easy';
      const newStats = {
        reviewed: stats.reviewed + 1,
        correct: stats.correct + (isCorrect ? 1 : 0),
        total: stats.total,
      };

      switch (rating) {
        case 'again':
          if (currentIndex >= 2) {
            newQueue.splice(currentIndex, 1);
            newQueue.splice(currentIndex - 2, 0, card);
            setCurrentIndex(currentIndex - 2);
          } else {
            newQueue.splice(currentIndex, 1);
            newQueue.unshift(card);
            setCurrentIndex(0);
          }
          break;
        case 'hard':
          if (currentIndex >= 1) {
            newQueue.splice(currentIndex, 1);
            newQueue.splice(currentIndex - 1, 0, card);
            setCurrentIndex(currentIndex - 1);
          } else {
            setCurrentIndex(currentIndex);
          }
          break;
        case 'good':
          newQueue.splice(currentIndex, 1);
          newQueue.push(card);
          if (currentIndex >= newQueue.length - 1) {
            setStats(newStats);
            setQueue(newQueue);
            setPhase('summary');
            return;
          }
          break;
        case 'easy':
          newQueue.splice(currentIndex, 1);
          if (newQueue.length === 0) {
            setStats(newStats);
            setQueue([]);
            setPhase('summary');
            return;
          }
          if (currentIndex >= newQueue.length) {
            setStats(newStats);
            setQueue(newQueue);
            setPhase('summary');
            return;
          }
          break;
      }

      setStats(newStats);
      setQueue(newQueue);
      setIsFlipped(false);
    },
    [currentIndex, queue, stats]
  );

  /* ─── Add custom card ─── */
  const addCustomCard = useCallback(() => {
    if (!newFront.trim() || !newBack.trim()) return;
    const card: FlashCard = makeCard(newFront.trim(), newBack.trim(), newCategory, 1);
    const updated = [...customCards, card];
    setCustomCards(updated);
    saveCustomCards(updated);
    setNewFront('');
    setNewBack('');
    setDialogOpen(false);
  }, [newFront, newBack, newCategory, customCards]);

  /* ─── Delete custom card ─── */
  const deleteCustomCard = useCallback(
    (id: string) => {
      const updated = customCards.filter((c) => c.id !== id);
      setCustomCards(updated);
      saveCustomCards(updated);
    },
    [customCards]
  );

  /* ─── Progress ─── */
  const progressPercent = stats.total > 0 ? Math.round((stats.reviewed / stats.total) * 100) : 0;
  const accuracyRate = stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0;

  /* ═══════════════════════ Render ═══════════════════════ */

  return (
    <div style={FONT_STYLE} className="space-y-4">
      <FeatureHeader
        icon="🃏"
        title="Math Flashcards"
        description="Study formulas with spaced repetition"
        gradient="from-emerald-500 to-teal-600"
      />

      {/* ─── Custom Card Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
            <Plus className="w-3.5 h-3.5" />
            Custom Card
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add Custom Flashcard</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_LIST.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      newCategory === cat
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                        : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Front (Question / Prompt)</label>
              <Input
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder='e.g., Quadratic Formula'
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Back (LaTeX Answer)</label>
              <Textarea
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder='e.g., x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}'
                className="text-sm min-h-20 font-mono"
              />
            </div>
            <Button onClick={addCustomCard} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!newFront.trim() || !newBack.trim()}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence mode="wait">
        {/* ═══════════ Category Selection ═══════════ */}
        {phase === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-foreground">Choose a Deck</span>
              <span className="text-xs text-muted-foreground ml-auto">{allCards.length} total cards</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* All category */}
              <button
                onClick={() => startSession('All')}
                className="group relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm font-bold">∑</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">All</p>
                    <p className="text-[10px] text-muted-foreground">{deckCounts['All']} cards</p>
                  </div>
                </div>
              </button>

              {/* Individual categories */}
              {CATEGORY_LIST.map((cat) => {
                const icon = CATEGORY_ICONS[cat] || '?';
                const count = deckCounts[cat] || 0;
                const colors = CATEGORY_COLORS[cat] || '';
                return (
                  <button
                    key={cat}
                    onClick={() => startSession(cat)}
                    className="group flex flex-col items-start gap-1.5 p-3.5 rounded-xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm text-white text-sm font-bold bg-gradient-to-br ${
                        cat === 'Algebra' ? 'from-blue-500 to-blue-600' :
                        cat === 'Trigonometry' ? 'from-purple-500 to-purple-600' :
                        cat === 'Calculus' ? 'from-orange-500 to-orange-600' :
                        cat === 'Geometry' ? 'from-teal-500 to-teal-600' :
                        'from-rose-500 to-rose-600'
                      }`}>
                        <span style={FONT_STYLE}>{icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{cat}</p>
                        <p className="text-[10px] text-muted-foreground">{count} cards</p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Custom category */}
              {customCards.length > 0 && (
                <button
                  onClick={() => startSession('Custom')}
                  className="group flex flex-col items-start gap-1.5 p-3.5 rounded-xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-bold">✎</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Custom</p>
                      <p className="text-[10px] text-muted-foreground">{deckCounts['Custom']} cards</p>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Custom cards list */}
            {customCards.length > 0 && (
              <Card className="border-border/60">
                <CardContent className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Custom Cards ({customCards.length})</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {customCards.map((card) => (
                      <div key={card.id} className="flex items-center gap-2 group">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${CATEGORY_COLORS[card.category] || CATEGORY_COLORS['Custom']}`}>
                          {card.category}
                        </span>
                        <span className="text-xs text-foreground truncate flex-1">{card.front}</span>
                        <button
                          onClick={() => deleteCustomCard(card.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ═══════════ Study Phase ═══════════ */}
        {phase === 'study' && queue.length > 0 && currentIndex < queue.length && (
          <motion.div
            key="study"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            {/* Progress bar + stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  {stats.reviewed} / {stats.total} reviewed
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {accuracyRate}% accuracy
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-500" />
                  {queue.length - currentIndex} remaining
                </span>
                <button
                  onClick={() => setPhase('select')}
                  className="ml-auto flex items-center gap-1 text-red-400 hover:text-red-500 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  End
                </button>
              </div>
            </div>

            {/* 3D Flip Card */}
            <div className="flex justify-center" style={{ perspective: '1000px' }}>
              <motion.div
                className="relative w-full max-w-md cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front */}
                <div
                  className="rounded-2xl border border-border bg-card shadow-lg p-6 min-h-[280px] flex flex-col items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border mb-4 ${CATEGORY_COLORS[queue[currentIndex]?.category] || CATEGORY_COLORS['Custom']}`}>
                    {queue[currentIndex]?.category}
                  </span>
                  <p className="text-sm text-muted-foreground mb-1">
                    {currentIndex + 1} / {stats.total}
                  </p>
                  <h3 className="text-lg font-bold text-foreground text-center mt-2 leading-relaxed">
                    {queue[currentIndex]?.front}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-emerald-500" />
                    Tap to reveal
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 rounded-2xl border border-emerald-500/30 bg-card shadow-lg shadow-emerald-500/5 p-6 min-h-[280px] flex flex-col items-center justify-center"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border mb-3 ${CATEGORY_COLORS[queue[currentIndex]?.category] || CATEGORY_COLORS['Custom']}`}>
                    {queue[currentIndex]?.category}
                  </span>
                  <p className="text-sm text-muted-foreground mb-2">
                    {currentIndex + 1} / {stats.total}
                  </p>
                  <div className="mt-1 flex-1 flex items-center justify-center w-full overflow-x-auto">
                    <KaTeXRenderer latex={queue[currentIndex]?.back || ''} displayMode className="text-xl" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Rating buttons */}
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-center text-muted-foreground font-medium">How well did you know this?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {RATING_CONFIG.map((r) => (
                      <button
                        key={r.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRating(r.key);
                        }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${r.color}`}
                      >
                        {r.icon}
                        {r.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══════════ Session Summary ═══════════ */}
        {phase === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <Card className="border-emerald-500/30 shadow-lg shadow-emerald-500/5">
              <CardContent className="p-6 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
                >
                  <Trophy className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Session Complete!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.reviewed}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Reviewed</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{accuracyRate}%</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Accuracy</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.total}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Total</p>
                  </div>
                </div>

                {/* Grade */}
                <div className="pt-2">
                  <p className="text-3xl font-bold" style={FONT_STYLE}>
                    {accuracyRate >= 90 ? 'A+' : accuracyRate >= 80 ? 'A' : accuracyRate >= 70 ? 'B' : accuracyRate >= 60 ? 'C' : 'D'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {accuracyRate >= 90
                      ? 'Outstanding! You know your formulas!'
                      : accuracyRate >= 80
                        ? 'Great work! Almost perfect.'
                        : accuracyRate >= 70
                          ? 'Good job! Keep practicing.'
                          : accuracyRate >= 60
                            ? 'Not bad! Review the tough ones.'
                            : 'Keep studying — you\'ll improve!'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => startSession(selectedCategory)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Retry Deck
              </Button>
              <Button variant="outline" onClick={() => setPhase('select')}>
                <Layers className="w-4 h-4 mr-1.5" />
                Choose Deck
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}