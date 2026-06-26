'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { initTelegramTheme } from '@/lib/telegram';
import { useOneMathStore } from '@/stores/onemath-store';
import AppShell from '@/components/onemath/AppShell';
import HomeScreen from '@/components/onemath/HomeScreen';
import MathSolver from '@/components/onemath/MathSolver';
import EquationGrapher from '@/components/onemath/EquationGrapher';
import FormulaDictionary from '@/components/onemath/FormulaDictionary';
import MoreFeatures from '@/components/onemath/MoreFeatures';

// Feature components - lazy loaded
import ScientificCalculator from '@/components/onemath/features/ScientificCalculator';
import MatrixCalculator from '@/components/onemath/features/MatrixCalculator';
import StatisticsCalculator from '@/components/onemath/features/StatisticsCalculator';
import TrigonometryCalculator from '@/components/onemath/features/TrigonometryCalculator';
import ComplexNumbers from '@/components/onemath/features/ComplexNumbers';
import GeometryCalculator from '@/components/onemath/features/GeometryCalculator';
import QuadraticSolver from '@/components/onemath/features/QuadraticSolver';
import LinearSystems from '@/components/onemath/features/LinearSystems';
import SequencesSeries from '@/components/onemath/features/SequencesSeries';
import LogarithmCalculator from '@/components/onemath/features/LogarithmCalculator';
import ProbabilityCalculator from '@/components/onemath/features/ProbabilityCalculator';
import PercentageCalculator from '@/components/onemath/features/PercentageCalculator';
import PrimeFactorization from '@/components/onemath/features/PrimeFactorization';
import NumberBaseConverter from '@/components/onemath/features/NumberBaseConverter';
import GCDLCMCalculator from '@/components/onemath/features/GCDLCMCalculator';
import UnitConverter from '@/components/onemath/features/UnitConverter';
import DerivativeCalculator from '@/components/onemath/features/DerivativeCalculator';
import IntegralCalculator from '@/components/onemath/features/IntegralCalculator';
import LimitCalculator from '@/components/onemath/features/LimitCalculator';
import LaTeXRenderer from '@/components/onemath/features/LaTeXRenderer';
import NumberProperties from '@/components/onemath/features/NumberProperties';
import BinaryOperations from '@/components/onemath/features/BinaryOperations';
import RomanNumeralConverter from '@/components/onemath/features/RomanNumeralConverter';
import VectorCalculator from '@/components/onemath/features/VectorCalculator';
import PolynomialTools from '@/components/onemath/features/PolynomialTools';
import PracticeProblems from '@/components/onemath/features/PracticeProblems';
import MathConstants from '@/components/onemath/features/MathConstants';
import SolutionHistory from '@/components/onemath/features/SolutionHistory';
import QuickReference from '@/components/onemath/features/QuickReference';
import NumberTheory from '@/components/onemath/features/NumberTheory';
import MathScratchpad from '@/components/onemath/features/MathScratchpad';
import FractionCalculator from '@/components/onemath/features/FractionCalculator';
import EquationBalancer from '@/components/onemath/features/EquationBalancer';
import CoordinateGeometry from '@/components/onemath/features/CoordinateGeometry';
import InequalitySolver from '@/components/onemath/features/InequalitySolver';
import MathFlashcards from '@/components/onemath/features/MathFlashcards';
import SetTheory from '@/components/onemath/features/SetTheory';
import FinancialCalculator from '@/components/onemath/features/FinancialCalculator';
import CurvePlotter from '@/components/onemath/features/CurvePlotter';
import TruthTableGenerator from '@/components/onemath/features/TruthTableGenerator';
import RegressionCalculator from '@/components/onemath/features/RegressionCalculator';
import TaylorSeriesVisualizer from '@/components/onemath/features/TaylorSeriesVisualizer';
import UnitCircleExplorer from '@/components/onemath/features/UnitCircleExplorer';
import MatrixTransformVisualizer from '@/components/onemath/features/MatrixTransformVisualizer';
import FunctionComparison from '@/components/onemath/features/FunctionComparison';

const featureComponents: Record<string, React.ComponentType> = {
  'scientific-calc': ScientificCalculator,
  'matrix-calc': MatrixCalculator,
  'statistics': StatisticsCalculator,
  'trigonometry': TrigonometryCalculator,
  'complex-numbers': ComplexNumbers,
  'geometry': GeometryCalculator,
  'quadratic': QuadraticSolver,
  'linear-systems': LinearSystems,
  'sequences': SequencesSeries,
  'logarithm': LogarithmCalculator,
  'probability': ProbabilityCalculator,
  'percentage': PercentageCalculator,
  'prime-factorization': PrimeFactorization,
  'number-base': NumberBaseConverter,
  'gcd-lcm': GCDLCMCalculator,
  'unit-converter': UnitConverter,
  'derivative': DerivativeCalculator,
  'integral': IntegralCalculator,
  'limit-calc': LimitCalculator,
  'latex-renderer': LaTeXRenderer,
  'number-properties': NumberProperties,
  'binary-ops': BinaryOperations,
  'roman-numeral': RomanNumeralConverter,
  'vector-calc': VectorCalculator,
  'polynomial': PolynomialTools,
  'calculus': DerivativeCalculator,
  'practice': PracticeProblems,
  'constants': MathConstants,
  'history-panel': SolutionHistory,
  'quick-ref': QuickReference,
  'number-theory': NumberTheory,
  'scratchpad': MathScratchpad,
  'fractions': FractionCalculator,
  'equation-balancer': EquationBalancer,
  'coordinate-geometry': CoordinateGeometry,
  'inequality-solver': InequalitySolver,
  'flashcards': MathFlashcards,
  'set-theory': SetTheory,
  'financial-calc': FinancialCalculator,
  'curve-plotter': CurvePlotter,
  'truth-table': TruthTableGenerator,
  'regression': RegressionCalculator,
  'taylor-series': TaylorSeriesVisualizer,
  'unit-circle': UnitCircleExplorer,
  'matrix-transform': MatrixTransformVisualizer,
  'function-compare': FunctionComparison,
};

function FeatureRenderer({ featureId }: { featureId: string }) {
  const Component = featureComponents[featureId];
  if (!Component) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Feature not found: {featureId}</p>
      </div>
    );
  }
  return <Component />;
}

function TabContent() {
  const { activeTab, activeFeature } = useOneMathStore();

  // If a specific feature is selected, show it
  if (activeFeature) {
    return <FeatureRenderer featureId={activeFeature} />;
  }

  switch (activeTab) {
    case 'home':
      return <HomeScreen />;
    case 'solver':
      return <MathSolver />;
    case 'graph':
      return <EquationGrapher />;
    case 'formulas':
      return <FormulaDictionary />;
    case 'more':
      return <MoreFeatures />;
    default:
      return <HomeScreen />;
  }
}

export default function OneMathApp() {
  const mounted = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      initTelegramTheme();
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => setIsReady(true));
    }
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto mb-6 w-20 h-20"
          >
            {/* Outer glow ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-emerald-200 dark:border-emerald-800"
            />
            {/* Spinning arc */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-500 border-r-emerald-500"
            />
            {/* Inner pulsing circle */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"
            >
              <span
                className="text-xl font-bold text-emerald-600 dark:text-emerald-400"
                style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
              >
                ∑
              </span>
            </motion.div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm font-semibold text-foreground tracking-tight"
          >
            One<span className="text-emerald-500">Math</span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground mt-1"
          >
            Loading your math assistant...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <TabContent />
    </AppShell>
  );
}