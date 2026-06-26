'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import KaTeXRenderer from '../KaTeXRenderer';
import {
  RefreshCw,
  Check,
  X,
  Lightbulb,
  Flame,
  Trophy,
  Clock,
  Target,
  ChevronRight,
  SkipForward,
  RotateCcw,
} from 'lucide-react';

/* ──────────────────── Types ──────────────────── */

interface Problem {
  question: string;
  latex: string;
  answer: string;
  hint: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

type CategoryType = 'Arithmetic' | 'Algebra' | 'Fractions' | 'Powers' | 'Percentages' | 'Equations';
type DifficultyType = 'easy' | 'medium' | 'hard';

/* ──────────────────── Problem Generation ──────────────────── */

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function simplifyFrac(num: number, den: number): [number, number] {
  const g = gcd(num, den);
  return [num / g, den / g];
}

function generateProblem(category: CategoryType, difficulty: DifficultyType): Problem {
  const generators: Record<CategoryType, () => Problem> = {
    Arithmetic: () => genArithmetic(difficulty),
    Algebra: () => genAlgebra(difficulty),
    Fractions: () => genFractions(difficulty),
    Powers: () => genPowers(difficulty),
    Percentages: () => genPercentages(difficulty),
    Equations: () => genEquations(difficulty),
  };
  return generators[category]();
}

function genArithmetic(d: DifficultyType): Problem {
  const max = d === 'easy' ? 20 : d === 'medium' ? 100 : 500;
  const ops = d === 'easy' ? ['+', '-'] : ['+', '-', '×', '÷'];
  const op = ops[randInt(0, ops.length - 1)];

  let a: number, b: number, answer: number;
  switch (op) {
    case '+':
      a = randInt(1, max);
      b = randInt(1, max);
      answer = a + b;
      break;
    case '-':
      a = randInt(1, max);
      b = randInt(1, a);
      answer = a - b;
      break;
    case '×':
      a = randInt(2, d === 'hard' ? 25 : 12);
      b = randInt(2, d === 'hard' ? 25 : 12);
      answer = a * b;
      break;
    default: // ÷
      b = randInt(2, 12);
      answer = randInt(2, d === 'hard' ? 25 : 12);
      a = b * answer;
      break;
  }

  return {
    question: `What is ${a} ${op} ${b}?`,
    latex: `${a} ${op === '×' ? '\\times' : op === '÷' ? '\\div' : op} ${b} = \\,?`,
    answer: String(answer),
    hint: `Think about ${op === '+' ? 'adding' : op === '-' ? 'subtracting' : op === '×' ? 'multiplying' : 'dividing'} step by step`,
    category: 'Arithmetic',
    difficulty: d,
  };
}

function genAlgebra(d: DifficultyType): Problem {
  if (d === 'easy') {
    const x = randInt(1, 10);
    const b = randInt(1, 10);
    const a = x + b;
    return {
      question: `Solve for x: x + ${b} = ${a}`,
      latex: `x + ${b} = ${a}`,
      answer: String(x),
      hint: `Subtract ${b} from both sides`,
      category: 'Algebra',
      difficulty: d,
    };
  }

  if (d === 'medium') {
    const x = randInt(1, 15);
    const m = randInt(2, 6);
    const b = randInt(1, 20);
    const result = m * x + b;
    return {
      question: `Solve for x: ${m}x + ${b} = ${result}`,
      latex: `${m}x + ${b} = ${result}`,
      answer: String(x),
      hint: `First subtract ${b}, then divide by ${m}`,
      category: 'Algebra',
      difficulty: d,
    };
  }

  // hard: quadratic
  // Generate quadratic x² + bx + c = 0 where roots are integers
  const r1 = randInt(-8, 8);
  let r2 = randInt(-8, 8);
  while (r2 === r1) r2 = randInt(-8, 8);
  const bCoeff = -(r1 + r2);
  const cCoeff = r1 * r2;
  return {
    question: `Find the roots of x² ${bCoeff >= 0 ? `+ ${bCoeff}` : `- ${Math.abs(bCoeff)}`}x ${cCoeff >= 0 ? `+ ${cCoeff}` : `- ${Math.abs(cCoeff)}`} = 0`,
    latex: `x^2 ${bCoeff >= 0 ? `+ ${bCoeff}` : `- ${Math.abs(bCoeff)}`}x ${cCoeff >= 0 ? `+ ${cCoeff}` : `- ${Math.abs(cCoeff)}`} = 0`,
    answer: `x = ${Math.min(r1, r2)}, ${Math.max(r1, r2)}`,
    hint: `Try factoring: (x - r₁)(x - r₂) = 0`,
    category: 'Algebra',
    difficulty: d,
  };
}

function genFractions(d: DifficultyType): Problem {
  const maxD = d === 'easy' ? 6 : d === 'medium' ? 10 : 12;
  let n1 = randInt(1, maxD - 1);
  let d1 = randInt(2, maxD);
  let n2 = randInt(1, maxD - 1);
  let d2 = randInt(2, maxD);
  const ops = ['+', '-'];
  const op = ops[randInt(0, 1)];

  // Calculate result
  let rn: number, rd: number;
  if (op === '+') {
    rn = n1 * d2 + n2 * d1;
    rd = d1 * d2;
  } else {
    // Make sure result is positive
    if (n1 / d1 < n2 / d2) {
      [n1, d1, n2, d2] = [n2, d2, n1, d1];
    }
    rn = n1 * d2 - n2 * d1;
    rd = d1 * d2;
  }
  const [sn, sd] = simplifyFrac(rn, rd);
  const answerText = sd === 1 ? String(sn) : `${sn}/${sd}`;

  return {
    question: `Calculate ${n1}/${d1} ${op} ${n2}/${d2}`,
    latex: `\\frac{${n1}}{${d1}} ${op} \\frac{${n2}}{${d2}} = \\,?`,
    answer: answerText,
    hint: `Find a common denominator first: ${d1 * d2}`,
    category: 'Fractions',
    difficulty: d,
  };
}

function genPowers(d: DifficultyType): Problem {
  const max = d === 'easy' ? 10 : d === 'medium' ? 12 : 15;
  const type = randInt(0, d === 'easy' ? 1 : 2);

  if (type === 0) {
    // Square
    const n = randInt(2, max);
    return {
      question: `What is ${n}²?`,
      latex: `${n}^2 = \\,?`,
      answer: String(n * n),
      hint: `${n} × ${n}`,
      category: 'Powers',
      difficulty: d,
    };
  }

  if (type === 1) {
    // Cube
    const n = randInt(2, d === 'hard' ? 10 : 7);
    return {
      question: `What is ${n}³?`,
      latex: `${n}^3 = \\,?`,
      answer: String(n * n * n),
      hint: `${n} × ${n} × ${n}`,
      category: 'Powers',
      difficulty: d,
    };
  }

  // Square root
  const n = randInt(2, 15);
  const sq = n * n;
  return {
    question: `What is √${sq}?`,
    latex: `\\sqrt{${sq}} = \\,?`,
    answer: String(n),
    hint: `Which number multiplied by itself equals ${sq}?`,
    category: 'Powers',
    difficulty: d,
  };
}

function genPercentages(d: DifficultyType): Problem {
  const type = randInt(0, d === 'easy' ? 1 : 2);

  if (type === 0) {
    // What is X% of Y?
    const pct = [10, 20, 25, 50, 75][randInt(0, 4)];
    const num = randInt(2, d === 'easy' ? 100 : 500) * (100 / pct > 1 ? 1 : 1);
    const val = Math.round((pct / 100) * num);
    return {
      question: `What is ${pct}% of ${num}?`,
      latex: `${pct}\\% \\text{ of } ${num} = \\,?`,
      answer: String(val),
      hint: `Multiply ${num} by ${pct}/100`,
      category: 'Percentages',
      difficulty: d,
    };
  }

  if (type === 1) {
    // X is what % of Y?
    const pct = [10, 20, 25, 50, 75, 80, 40, 60][randInt(0, 7)];
    const total = 100;
    const val = pct;
    return {
      question: `${val} is what percent of ${total}?`,
      latex: `${val} = \\,?\\% \\text{ of } ${total}`,
      answer: String(pct) + '%',
      hint: `Divide ${val} by ${total} and multiply by 100`,
      category: 'Percentages',
      difficulty: d,
    };
  }

  // Percentage increase/decrease
  const original = randInt(5, 20) * 10;
  const changePct = [10, 20, 25, 50][randInt(0, 3)];
  const isIncrease = Math.random() > 0.5;
  const newNum = isIncrease
    ? original + Math.round((changePct / 100) * original)
    : original - Math.round((changePct / 100) * original);
  return {
    question: `A ${isIncrease ? 'increase' : 'decrease'} of ${changePct}% on ${original} is?`,
    latex: `${isIncrease ? '' : ''}${original} \\xrightarrow{${changePct}\\% \\text{ ${isIncrease ? '↑' : '↓'}}} \\,?`,
    answer: String(newNum),
    hint: `Calculate ${changePct}% of ${original} and ${isIncrease ? 'add to' : 'subtract from'} ${original}`,
    category: 'Percentages',
    difficulty: d,
  };
}

function genEquations(d: DifficultyType): Problem {
  if (d === 'easy' || d === 'medium') {
    const x = randInt(1, 15);
    const a = randInt(1, d === 'easy' ? 3 : 6);
    const b = a * x;
    const c = randInt(0, 10);
    return {
      question: `Solve: ${a}x ${c > 0 ? `+ ${c}` : c < 0 ? `- ${Math.abs(c)}` : ''} = ${b + c}`,
      latex: `${a}x ${c > 0 ? `+ ${c}` : c < 0 ? `- ${Math.abs(c)}` : ''} = ${b + c}`,
      answer: `x = ${x}`,
      hint: c > 0 ? `Subtract ${c} from both sides, then divide by ${a}` : `Divide both sides by ${a}`,
      category: 'Equations',
      difficulty: d,
    };
  }

  // System of 2 equations
  const x = randInt(1, 8);
  const y = randInt(1, 8);
  const a1 = randInt(1, 4);
  const b1 = randInt(1, 4);
  const r1 = a1 * x + b1 * y;
  const a2 = randInt(1, 4);
  const b2 = randInt(1, 4);
  const r2 = a2 * x + b2 * y;
  return {
    question: `Solve the system:\n${a1}x + ${b1}y = ${r1}\n${a2}x + ${b2}y = ${r2}`,
    latex: `\\begin{cases} ${a1}x + ${b1}y = ${r1} \\\\ ${a2}x + ${b2}y = ${r2} \\end{cases}`,
    answer: `x = ${x}, y = ${y}`,
    hint: `Try elimination: multiply equations to eliminate one variable`,
    category: 'Equations',
    difficulty: d,
  };
}

/* ──────────────────── Constants ──────────────────── */

const categoryList: CategoryType[] = ['Arithmetic', 'Algebra', 'Fractions', 'Powers', 'Percentages', 'Equations'];
const difficultyList: DifficultyType[] = ['easy', 'medium', 'hard'];
const totalPerSession = 10;

const categoryIcons: Record<CategoryType, string> = {
  Arithmetic: '➕',
  Algebra: '🔤',
  Fractions: '½',
  Powers: 'ⁿ',
  Percentages: '%',
  Equations: '⚖️',
};

/* ──────────────────── Component ──────────────────── */

export default function PracticeProblems() {
  const [category, setCategory] = useState<CategoryType>('Arithmetic');
  const [difficulty, setDifficulty] = useState<DifficultyType>('easy');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [problemNum, setProblemNum] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startSession = useCallback(() => {
    const p = generateProblem(category, difficulty);
    setCurrentProblem(p);
    setUserAnswer('');
    setShowHint(false);
    setFeedback(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setProblemNum(1);
    setElapsed(0);
    setSessionDone(false);
    setStarted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, [category, difficulty]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const nextProblem = useCallback(() => {
    if (problemNum >= totalPerSession) {
      setSessionDone(true);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const p = generateProblem(category, difficulty);
    setCurrentProblem(p);
    setUserAnswer('');
    setShowHint(false);
    setFeedback(null);
    setProblemNum(n => n + 1);
  }, [category, difficulty, problemNum]);

  const checkAnswer = useCallback(() => {
    if (!currentProblem || !userAnswer.trim()) return;
    const isCorrect = userAnswer.trim().toLowerCase() === currentProblem.answer.toLowerCase();
    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
    setFeedback(isCorrect ? 'correct' : 'wrong');
  }, [currentProblem, userAnswer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (feedback) {
        nextProblem();
      } else {
        checkAnswer();
      }
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  /* ────────── Not Started ────────── */

  if (!started) {
    return (
      <div className="px-4 py-4 space-y-5">
        <div className="text-center mb-2">
          <div
            className="text-5xl mb-3"
            style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
          >
            ∞
          </div>
          <h2 className="text-xl font-bold text-foreground">Practice Mode</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sharpen your math skills with {totalPerSession} problems per session
          </p>
        </div>

        {/* Category Selection */}
        <div>
          <p className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Category</p>
          <div className="grid grid-cols-3 gap-2">
            {categoryList.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`p-3 rounded-xl border transition-all duration-200 text-center ${
                  category === cat
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm shadow-emerald-500/10'
                    : 'border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <span className="text-xl block mb-1">{categoryIcons[cat]}</span>
                <span className={`text-xs font-medium ${category === cat ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>
                  {cat}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <p className="text-xs font-semibold text-foreground mb-2.5 uppercase tracking-wider">Difficulty</p>
          <div className="grid grid-cols-3 gap-2">
            {difficultyList.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`p-3 rounded-xl border transition-all duration-200 text-center capitalize ${
                  difficulty === d
                    ? d === 'easy'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : d === 'medium'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                        : 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <span className="text-xs font-bold block">
                  {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'}
                </span>
                <span className="text-xs font-medium mt-1 block text-foreground">{d}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={startSession}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl text-sm font-semibold shadow-sm shadow-emerald-500/20"
        >
          <Target className="w-4 h-4 mr-2" />
          Start Practice — {category}, {difficulty}
        </Button>
      </div>
    );
  }

  /* ────────── Session Complete ────────── */

  if (sessionDone) {
    const pct = Math.round((score / totalPerSession) * 100);
    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'D';
    const gradeColor = pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-rose-500';

    return (
      <div className="px-4 py-4 space-y-5">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Session Complete!</h2>
          <p className="text-sm text-muted-foreground mt-1">{category} — {difficulty}</p>
        </motion.div>

        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 number-math">{score}/{totalPerSession}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Score</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 number-math">{pct}%</p>
                <p className="text-[11px] text-muted-foreground mt-1">Accuracy</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20">
                <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 number-math">{bestStreak}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Best Streak</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/60">
                <p className="text-3xl font-bold text-foreground number-math">{formatTime(elapsed)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Time</p>
              </div>
            </div>

            <div className="text-center mt-4 pt-4 border-t border-border/60">
              <span className={`text-4xl font-bold ${gradeColor}`} style={{ fontFamily: "'Latin Modern Math', serif" }}>{grade}</span>
              <p className="text-xs text-muted-foreground mt-1">Grade</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={startSession}
            variant="outline"
            className="flex-1 h-11 rounded-xl"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Retry
          </Button>
          <Button
            onClick={() => setStarted(false)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> New Topic
          </Button>
        </div>
      </div>
    );
  }

  /* ────────── Active Session ────────── */

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Stats Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            <span className="text-foreground font-bold">{problemNum}</span>/{totalPerSession}
          </span>
          {streak >= 2 && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400"
            >
              <Flame className="w-3.5 h-3.5" /> {streak}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="w-3 h-3 text-emerald-500" /> {score}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
          animate={{ width: `${(problemNum / totalPerSession) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Category & Difficulty Chips */}
      <div className="flex gap-2">
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
          {categoryIcons[category]} {category}
        </span>
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border capitalize ${
          difficulty === 'easy'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/30'
            : difficulty === 'medium'
              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/30'
              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/30'
        }`}>
          {difficulty}
        </span>
      </div>

      {/* Problem Card */}
      {currentProblem && (
        <AnimatePresence mode="wait">
          <motion.div
            key={problemNum}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-emerald-200/60 dark:border-emerald-800/40 overflow-hidden">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Problem {problemNum}</p>
                <div className="math-display">
                  <KaTeXRenderer latex={currentProblem.latex} className="text-lg" />
                </div>
                <p className="text-sm text-foreground mt-3 whitespace-pre-line">{currentProblem.question}</p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Hint */}
      {showHint && currentProblem && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">{currentProblem.hint}</p>
          </div>
        </motion.div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && currentProblem && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              feedback === 'correct'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-700/40'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300/60 dark:border-rose-700/40'
            }`}>
              {feedback === 'correct' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${feedback === 'correct' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {feedback === 'correct' ? 'Correct!' : 'Incorrect'}
                </p>
                {feedback === 'wrong' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Answer: <span className="font-semibold text-foreground" style={{ fontFamily: "'Latin Modern Math', serif" }}>{currentProblem.answer}</span>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      {!feedback && (
        <div className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              autoFocus
              className="w-full h-12 px-4 rounded-xl bg-card border border-border text-base text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 number-math"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowHint(true)}
              disabled={showHint}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <Lightbulb className="w-4 h-4" /> Hint
            </button>
            <button
              onClick={nextProblem}
              className="h-11 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors flex items-center justify-center gap-1.5"
              title="Skip"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <Button
              onClick={checkAnswer}
              disabled={!userAnswer.trim()}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl shadow-sm shadow-emerald-500/20"
            >
              Check <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Next Button (after feedback) */}
      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            onClick={nextProblem}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl shadow-sm shadow-emerald-500/20"
          >
            {problemNum >= totalPerSession ? (
              <><Trophy className="w-4 h-4 mr-2" /> See Results</>
            ) : (
              <><ChevronRight className="w-4 h-4 mr-2" /> Next Problem</>
            )}
          </Button>
        </motion.div>
      )}

      {/* Quit Session */}
      <button
        onClick={() => {
          if (timerRef.current) clearInterval(timerRef.current);
          setStarted(false);
        }}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
      >
        Quit session
      </button>
    </div>
  );
}