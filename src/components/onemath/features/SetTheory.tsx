'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';
import KaTeXRenderer from '../KaTeXRenderer';

/* ─── helpers ─── */
function parseSet(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function fmtSet(elems: string[]): string {
  if (elems.length === 0) return '∅';
  return `{${elems.join(', ')}}`;
}

function setEq(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

/* ─── 2-set Venn diagram ─── */
function VennDiagram2({
  op,
  setA,
  setB,
}: {
  op: string;
  setA: string[];
  setB: string[];
}) {
  const onlyA = setA.filter((x) => !setB.includes(x));
  const onlyB = setB.filter((x) => !setA.includes(x));
  const inter = setA.filter((x) => setB.includes(x));

  const clipId = 'vennClip' + Math.random().toString(36).slice(2, 8);

  const shadeUnion = op === 'union' || op === 'complement';
  const shadeInter = op === 'intersection';
  const shadeAB = op === 'diffAB' || op === 'symDiff';
  const shadeBA = op === 'diffBA' || op === 'symDiff';
  const shadeComplement = op === 'complement';

  return (
    <svg viewBox="0 0 300 220" className="w-full max-w-[260px] mx-auto">
      <defs>
        <clipPath id={`${clipId}A`}>
          <circle cx="115" cy="110" r="75" />
        </clipPath>
        <clipPath id={`${clipId}B`}>
          <circle cx="185" cy="110" r="75" />
        </clipPath>
        <clipPath id={`${clipId}NotA`}>
          <rect x="0" y="0" width="300" height="220" />
          <circle cx="115" cy="110" r="75" />
        </clipPath>
        <clipPath id={`${clipId}NotB`}>
          <rect x="0" y="0" width="300" height="220" />
          <circle cx="185" cy="110" r="75" />
        </clipPath>
      </defs>

      {/* Complement background */}
      {shadeComplement && (
        <rect x="5" y="5" width="290" height="210" rx="12" fill="#10b981" opacity="0.08" stroke="#10b981" strokeWidth="1" strokeOpacity="0.3" />
      )}

      {/* Union shading */}
      {shadeUnion && !shadeComplement && (
        <>
          <circle cx="115" cy="110" r="75" fill="#10b981" opacity="0.2" />
          <circle cx="185" cy="110" r="75" fill="#10b981" opacity="0.2" />
        </>
      )}

      {/* Intersection shading */}
      {shadeInter && (
        <g clipPath={`url(#${clipId}A)`}>
          <circle cx="185" cy="110" r="75" fill="#10b981" opacity="0.2" />
        </g>
      )}

      {/* A \ B shading */}
      {shadeAB && (
        <g clipPath={`url(#${clipId}A)`}>
          <g clipPath={`url(#${clipId}NotB)`}>
            <rect x="0" y="0" width="300" height="220" fill="#10b981" opacity="0.2" />
          </g>
        </g>
      )}

      {/* B \ A shading */}
      {shadeBA && (
        <g clipPath={`url(#${clipId}B)`}>
          <g clipPath={`url(#${clipId}NotA)`}>
            <rect x="0" y="0" width="300" height="220" fill="#10b981" opacity="0.2" />
          </g>
        </g>
      )}

      {/* Circle outlines */}
      <circle cx="115" cy="110" r="75" fill="none" stroke="#10b981" strokeWidth="2" />
      <circle cx="185" cy="110" r="75" fill="none" stroke="#10b981" strokeWidth="2" />

      {/* Complement label */}
      {shadeComplement && (
        <text x="150" y="20" textAnchor="middle" className="text-xs font-bold fill-emerald-500">U</text>
      )}

      {/* Set labels */}
      <text x="70" y="115" textAnchor="middle" className="text-sm font-bold fill-emerald-600" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>A</text>
      <text x="230" y="115" textAnchor="middle" className="text-sm font-bold fill-emerald-600" style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}>B</text>

      {/* Only-A elements */}
      {onlyA.slice(0, 4).map((e, i) => (
        <text key={`a${i}`} x={65} y={135 + i * 14} textAnchor="middle" className="text-[9px] fill-foreground/70" style={{ fontFamily: "'Latin Modern Math', serif" }}>{e}</text>
      ))}
      {/* Only-B elements */}
      {onlyB.slice(0, 4).map((e, i) => (
        <text key={`b${i}`} x={235} y={135 + i * 14} textAnchor="middle" className="text-[9px] fill-foreground/70" style={{ fontFamily: "'Latin Modern Math', serif" }}>{e}</text>
      ))}
      {/* Intersection elements */}
      {inter.slice(0, 4).map((e, i) => (
        <text key={`i${i}`} x={150} y={135 + i * 14} textAnchor="middle" className="text-[9px] fill-emerald-700 dark:fill-emerald-300 font-medium" style={{ fontFamily: "'Latin Modern Math', serif" }}>{e}</text>
      ))}
    </svg>
  );
}

/* ─── 3-set Venn diagram ─── */
function VennDiagram3({ a, b, c, ab, ac, bc, abc }: { a: number; b: number; c: number; ab: number; ac: number; bc: number; abc: number }) {
  return (
    <svg viewBox="0 0 320 280" className="w-full max-w-[280px] mx-auto">
      {/* Outer region labels */}
      <text x="160" y="18" textAnchor="middle" className="text-xs font-bold fill-emerald-500" style={{ fontFamily: "'Latin Modern Math', serif" }}>U</text>

      {/* Background rect */}
      <rect x="5" y="5" width="310" height="270" rx="12" fill="none" stroke="#10b981" strokeWidth="1" strokeOpacity="0.2" />

      {/* Circles: A=left, B=right, C=bottom-center */}
      <circle cx="140" cy="115" r="72" fill="#10b981" opacity="0.06" stroke="#10b981" strokeWidth="2" />
      <circle cx="200" cy="115" r="72" fill="#10b981" opacity="0.06" stroke="#10b981" strokeWidth="2" />
      <circle cx="170" cy="165" r="72" fill="#10b981" opacity="0.06" stroke="#10b981" strokeWidth="2" />

      {/* Labels */}
      <text x="95" y="108" textAnchor="middle" className="text-sm font-bold fill-emerald-600" style={{ fontFamily: "'Latin Modern Math', serif" }}>A</text>
      <text x="245" y="108" textAnchor="middle" className="text-sm font-bold fill-emerald-600" style={{ fontFamily: "'Latin Modern Math', serif" }}>B</text>
      <text x="170" y="230" textAnchor="middle" className="text-sm font-bold fill-emerald-600" style={{ fontFamily: "'Latin Modern Math', serif" }}>C</text>

      {/* Region values */}
      <text x="108" y="78" textAnchor="middle" className="text-[10px] fill-foreground/60" style={{ fontFamily: "'Latin Modern Math', serif" }}>{a}</text>
      <text x="212" y="78" textAnchor="middle" className="text-[10px] fill-foreground/60" style={{ fontFamily: "'Latin Modern Math', serif" }}>{b}</text>
      <text x="170" y="248" textAnchor="middle" className="text-[10px] fill-foreground/60" style={{ fontFamily: "'Latin Modern Math', serif" }}>{c}</text>
      <text x="140" y="130" textAnchor="middle" className="text-[10px] fill-emerald-700 dark:fill-emerald-300 font-semibold" style={{ fontFamily: "'Latin Modern Math', serif" }}>{ab}</text>
      <text x="170" y="98" textAnchor="middle" className="text-[10px] fill-emerald-700 dark:fill-emerald-300 font-semibold" style={{ fontFamily: "'Latin Modern Math', serif" }}>{ac}</text>
      <text x="200" y="150" textAnchor="middle" className="text-[10px] fill-emerald-700 dark:fill-emerald-300 font-semibold" style={{ fontFamily: "'Latin Modern Math', serif" }}>{bc}</text>
      <text x="170" y="140" textAnchor="middle" className="text-xs fill-emerald-600 font-bold" style={{ fontFamily: "'Latin Modern Math', serif" }}>{abc}</text>
    </svg>
  );
}

/* ─── Operation type ─── */
type Op2Key = 'union' | 'intersection' | 'diffAB' | 'diffBA' | 'symDiff' | 'complement';

const OPS: { key: Op2Key; label: string; symbol: string }[] = [
  { key: 'union', label: 'Union', symbol: 'A∪B' },
  { key: 'intersection', label: 'Intersection', symbol: 'A∩B' },
  { key: 'diffAB', label: 'A \\ B', symbol: 'A\\B' },
  { key: 'diffBA', label: 'B \\ A', symbol: 'B\\A' },
  { key: 'symDiff', label: 'Sym Diff', symbol: 'A△B' },
  { key: 'complement', label: 'Complement', symbol: "A'" },
];

/* ─── Main Component ─── */
export default function SetTheory() {
  const [tab, setTab] = useState<'operations' | 'properties' | 'counting'>('operations');

  // Operations state
  const [inputA, setInputA] = useState('1, 2, 3, 4, 5');
  const [inputB, setInputB] = useState('3, 4, 5, 6, 7');
  const [inputU, setInputU] = useState('1, 2, 3, 4, 5, 6, 7, 8, 9, 10');
  const [activeOp, setActiveOp] = useState<Op2Key>('union');

  // Counting state
  const [countAB, setCountAB] = useState('8');
  const [countBA, setCountBA] = useState('5');
  const [countABi, setCountABi] = useState('3');
  const [countCA, setCountCA] = useState('6');
  const [countCB, setCountCB] = useState('4');
  const [countCC, setCountCC] = useState('7');
  const [countABiC, setCountABiC] = useState('1');
  const [countACiB, setCountACiB] = useState('2');
  const [countBCiA, setCountBCiA] = useState('1');
  const [countABC, setCountABC] = useState('1');
  const [useThreeSets, setUseThreeSets] = useState(false);

  const setA = useMemo(() => parseSet(inputA), [inputA]);
  const setB = useMemo(() => parseSet(inputB), [inputB]);
  const setU = useMemo(() => parseSet(inputU), [inputU]);

  /* ─── Compute 2-set operation ─── */
  const opResult = useMemo(() => {
    const aSet = new Set(setA);
    const bSet = new Set(setB);
    const uSet = new Set(setU);
    switch (activeOp) {
      case 'union':
        return [...new Set([...setA, ...setB])];
      case 'intersection':
        return setA.filter((x) => bSet.has(x));
      case 'diffAB':
        return setA.filter((x) => !bSet.has(x));
      case 'diffBA':
        return setB.filter((x) => !aSet.has(x));
      case 'symDiff':
        return [...setA.filter((x) => !bSet.has(x)), ...setB.filter((x) => !aSet.has(x))];
      case 'complement':
        return setU.filter((x) => !aSet.has(x));
      default:
        return [];
    }
  }, [setA, setB, setU, activeOp]);

  const opLatex = useMemo(() => {
    const a = fmtSet(setA);
    const b = fmtSet(setB);
    const r = fmtSet(opResult);
    switch (activeOp) {
      case 'union':
        return [`A \\cup B = ${a} \\cup ${b} = ${r.replace(/[{},]/g, (m) => m === '{' ? '\\{' : m === '}' ? '\\}' : ', ')}`, `|A \\cup B| = ${opResult.length}`];
      case 'intersection':
        return [`A \\cap B = ${a} \\cap ${b} = ${r.replace(/[{},]/g, (m) => m === '{' ? '\\{' : m === '}' ? '\\}' : ', ')}`, `|A \\cap B| = ${opResult.length}`];
      case 'diffAB':
        return [`A \\setminus B = ${a} \\setminus ${b} = ${r.replace(/[{},]/g, (m) => m === '{' ? '\\{' : m === '}' ? '\\}' : ', ')}`];
      case 'diffBA':
        return [`B \\setminus A = ${b} \\setminus ${a} = ${r.replace(/[{},]/g, (m) => m === '{' ? '\\{' : m === '}' ? '\\}' : ', ')}`];
      case 'symDiff':
        return [`A \\triangle B = (A \\setminus B) \\cup (B \\setminus A) = ${r.replace(/[{},]/g, (m) => m === '{' ? '\\{' : m === '}' ? '\\}' : ', ')}`];
      case 'complement':
        return [`A' = U \\setminus A = ${fmtSet(setU).replace(/[{},]/g, (m) => m === '{' ? '\\{' : m === '}' ? '\\}' : ', ')} \\setminus ${a.replace(/[{},]/g, (m) => m === '{' ? '\\{' : m === '}' ? '\\}' : ', ')} = ${r.replace(/[{},]/g, (m) => m === '{' ? '\\{' : m === '}' ? '\\}' : ', ')}`];
      default:
        return [];
    }
  }, [setA, setB, opResult, activeOp, setU]);

  const opRows = useMemo(() => {
    const opLabel = OPS.find((o) => o.key === activeOp)?.symbol || '';
    return [
      { label: opLabel, value: fmtSet(opResult), highlight: true },
      { label: '|A|', value: setA.length.toString() },
      { label: '|B|', value: setB.length.toString() },
      { label: '|Result|', value: opResult.length.toString(), highlight: true },
    ];
  }, [activeOp, opResult, setA, setB]);

  /* ─── Properties ─── */
  const propRows = useMemo(() => {
    const aSet = new Set(setA);
    const bSet = new Set(setB);
    const isSubset = setA.every((x) => bSet.has(x));
    const isSuperset = setB.every((x) => aSet.has(x));
    const isEqual = isSubset && isSuperset && setA.length === setB.length;
    const isProper = isSubset && !isEqual;
    const isDisjoint = !setA.some((x) => bSet.has(x));
    return [
      { label: 'A ⊆ B', value: isSubset ? 'Yes ✓' : 'No ✗', highlight: isSubset },
      { label: 'A ⊇ B', value: isSuperset ? 'Yes ✓' : 'No ✗', highlight: isSuperset },
      { label: 'A ⊂ B (proper)', value: isProper ? 'Yes ✓' : 'No ✗', highlight: isProper },
      { label: 'A = B', value: isEqual ? 'Yes ✓' : 'No ✗', highlight: isEqual },
      { label: 'A ∩ B = ∅', value: isDisjoint ? 'Yes (disjoint)' : 'No', highlight: isDisjoint },
    ];
  }, [setA, setB]);

  const powerSet = useMemo(() => {
    if (setA.length > 5) return null;
    const result: string[][] = [[]];
    for (const elem of setA) {
      const len = result.length;
      for (let i = 0; i < len; i++) {
        result.push([...result[i], elem]);
      }
    }
    return result.map(fmtSet);
  }, [setA]);

  const cartesianProduct = useMemo(() => {
    if (setA.length * setB.length > 100) return null;
    return setA.flatMap((a) => setB.map((b) => `(${a}, ${b})`));
  }, [setA, setB]);

  /* ─── Counting results ─── */
  const count2Rows = useMemo(() => {
    const a = parseInt(countAB) || 0;
    const b = parseInt(countBA) || 0;
    const ai = parseInt(countABi) || 0;
    const union = a + b - ai;
    return [
      { label: '|A|', value: a.toString() },
      { label: '|B|', value: b.toString() },
      { label: '|A∩B|', value: ai.toString() },
      { label: '|A∪B|', value: union.toString(), highlight: true },
    ];
  }, [countAB, countBA, countABi]);

  const count3Rows = useMemo(() => {
    const a = parseInt(countCA) || 0;
    const b = parseInt(countCB) || 0;
    const c = parseInt(countCC) || 0;
    const abi = parseInt(countABiC) || 0;
    const aci = parseInt(countACiB) || 0;
    const bci = parseInt(countBCiA) || 0;
    const abc = parseInt(countABC) || 0;
    const union = a + b + c - abi - aci - bci + abc;
    const onlyA = a - abi - aci + abc;
    const onlyB = b - abi - bci + abc;
    const onlyC = c - aci - bci + abc;
    const rAB = abi - abc;
    const rAC = aci - abc;
    const rBC = bci - abc;
    return [
      { label: '|A|', value: a.toString() },
      { label: '|B|', value: b.toString() },
      { label: '|C|', value: c.toString() },
      { label: '|A∩B|', value: abi.toString() },
      { label: '|A∩C|', value: aci.toString() },
      { label: '|B∩C|', value: bci.toString() },
      { label: '|A∩B∩C|', value: abc.toString() },
      { label: '|A∪B∪C|', value: union.toString(), highlight: true },
    ];
  }, [countCA, countCB, countCC, countABiC, countACiB, countBCiA, countABC]);

  const count3Regions = useMemo(() => {
    const a = parseInt(countCA) || 0;
    const b = parseInt(countCB) || 0;
    const c = parseInt(countCC) || 0;
    const abi = parseInt(countABiC) || 0;
    const aci = parseInt(countACiB) || 0;
    const bci = parseInt(countBCiA) || 0;
    const abc = parseInt(countABC) || 0;
    return {
      a: Math.max(0, a - abi - aci + abc),
      b: Math.max(0, b - abi - bci + abc),
      c: Math.max(0, c - aci - bci + abc),
      ab: Math.max(0, abi - abc),
      ac: Math.max(0, aci - abc),
      bc: Math.max(0, bci - abc),
      abc: Math.max(0, abc),
    };
  }, [countCA, countCB, countCC, countABiC, countACiB, countBCiA, countABC]);

  /* ─── Tab config ─── */
  const tabs = [
    { id: 'operations' as const, label: 'Operations' },
    { id: 'properties' as const, label: 'Properties' },
    { id: 'counting' as const, label: 'Counting' },
  ];

  const mathFont = { fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" };

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="∩"
        title="Set Theory Visualizer"
        description="Venn diagrams, set operations, properties & inclusion-exclusion"
      />

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              tab === t.id
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-muted/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════ OPERATIONS TAB ═══════ */}
        {tab === 'operations' && (
          <motion.div
            key="operations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Set A (comma-separated)</label>
                  <Input
                    value={inputA}
                    onChange={(e) => setInputA(e.target.value)}
                    placeholder="1, 2, 3, 4, 5"
                    className="mt-1 h-10 rounded-xl number-math"
                    style={mathFont}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Set B (comma-separated)</label>
                  <Input
                    value={inputB}
                    onChange={(e) => setInputB(e.target.value)}
                    placeholder="3, 4, 5, 6, 7"
                    className="mt-1 h-10 rounded-xl number-math"
                    style={mathFont}
                  />
                </div>
                {activeOp === 'complement' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="text-xs text-muted-foreground font-medium">Universal Set U</label>
                    <Input
                      value={inputU}
                      onChange={(e) => setInputU(e.target.value)}
                      placeholder="1, 2, 3, ..., 10"
                      className="mt-1 h-10 rounded-xl number-math"
                      style={mathFont}
                    />
                  </motion.div>
                )}

                {/* Operation buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {OPS.map((op) => (
                    <Button
                      key={op.key}
                      size="sm"
                      variant={activeOp === op.key ? 'default' : 'outline'}
                      onClick={() => setActiveOp(op.key)}
                      className={
                        activeOp === op.key
                          ? 'h-8 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/20'
                          : 'h-8 text-xs'
                      }
                      style={mathFont}
                    >
                      {op.symbol}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Venn diagram */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="shadow-sm border-emerald-200/40 dark:border-emerald-800/30 overflow-hidden">
                <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300" />
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 mb-3">
                    Venn Diagram — {OPS.find((o) => o.key === activeOp)?.label}
                  </p>
                  <VennDiagram2 op={activeOp} setA={setA} setB={setB} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Result */}
            <ResultCard title="Result" rows={opRows} latex={opLatex} KaTeXRenderer={KaTeXRenderer} />
          </motion.div>
        )}

        {/* ═══════ PROPERTIES TAB ═══════ */}
        {tab === 'properties' && (
          <motion.div
            key="properties"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Set A</label>
                  <Input
                    value={inputA}
                    onChange={(e) => setInputA(e.target.value)}
                    placeholder="1, 2, 3"
                    className="mt-1 h-10 rounded-xl number-math"
                    style={mathFont}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Set B</label>
                  <Input
                    value={inputB}
                    onChange={(e) => setInputB(e.target.value)}
                    placeholder="4, 5, 6"
                    className="mt-1 h-10 rounded-xl number-math"
                    style={mathFont}
                  />
                </div>
              </CardContent>
            </Card>

            <ResultCard title="Set Relationships" rows={propRows} />

            {/* Power Set */}
            {powerSet && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="shadow-sm border-emerald-200/40 dark:border-emerald-800/30 overflow-hidden">
                  <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
                        Power Set 𝒫(A) — {powerSet.length} subsets
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {powerSet.map((s, i) => (
                        <span
                          key={i}
                          className="inline-block px-2 py-0.5 rounded-lg text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 font-medium"
                          style={mathFont}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 math-display">
                      <KaTeXRenderer latex={`|\\mathcal{P}(A)| = 2^{|A|} = 2^{${setA.length}} = ${powerSet.length}`} className="text-sm" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {setA.length > 5 && (
              <Card className="shadow-sm border-border/60">
                <CardContent className="p-4 text-center text-xs text-muted-foreground">
                  Power set hidden: |A| = {setA.length} (max 5 for display)
                </CardContent>
              </Card>
            )}

            {/* Cartesian Product */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="shadow-sm border-emerald-200/40 dark:border-emerald-800/30 overflow-hidden">
                <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300" />
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">
                      Cartesian Product A × B
                    </p>
                  </div>
                  {cartesianProduct ? (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {cartesianProduct.map((pair, i) => (
                          <span
                            key={i}
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-muted/60 border border-border/30 font-mono number-math"
                            style={mathFont}
                          >
                            {pair}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 math-display">
                        <KaTeXRenderer latex={`|A \\times B| = |A| \\cdot |B| = ${setA.length} \\times ${setB.length} = ${cartesianProduct.length}`} className="text-sm" />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Too many pairs ({setA.length * setB.length}) to display
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════ COUNTING TAB ═══════ */}
        {tab === 'counting' && (
          <motion.div
            key="counting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Toggle 2-set / 3-set */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={!useThreeSets ? 'default' : 'outline'}
                onClick={() => setUseThreeSets(false)}
                className={!useThreeSets ? 'h-8 text-xs bg-emerald-600 hover:bg-emerald-700' : 'h-8 text-xs'}
              >
                2-Set Formula
              </Button>
              <Button
                size="sm"
                variant={useThreeSets ? 'default' : 'outline'}
                onClick={() => setUseThreeSets(true)}
                className={useThreeSets ? 'h-8 text-xs bg-emerald-600 hover:bg-emerald-700' : 'h-8 text-xs'}
              >
                3-Set Formula
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {!useThreeSets ? (
                <motion.div
                  key="count2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <Card className="shadow-sm border-border/60">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground font-medium" style={mathFont}>|A|</label>
                          <Input type="number" value={countAB} onChange={(e) => setCountAB(e.target.value)} className="mt-1 h-10 rounded-xl text-center number-math" style={mathFont} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium" style={mathFont}>|B|</label>
                          <Input type="number" value={countBA} onChange={(e) => setCountBA(e.target.value)} className="mt-1 h-10 rounded-xl text-center number-math" style={mathFont} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium" style={mathFont}>|A∩B|</label>
                          <Input type="number" value={countABi} onChange={(e) => setCountABi(e.target.value)} className="mt-1 h-10 rounded-xl text-center number-math" style={mathFont} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Formula */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="math-display">
                    <Card className="shadow-sm border-emerald-200/40 dark:border-emerald-800/30 overflow-hidden">
                      <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300" />
                      <CardContent className="p-4 space-y-2">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">Inclusion-Exclusion (2 sets)</p>
                        <KaTeXRenderer latex={`|A \\cup B| = |A| + |B| - |A \\cap B|`} className="text-sm" />
                        <KaTeXRenderer
                          latex={`|A \\cup B| = ${countAB} + ${countBA} - ${countABi} = ${((parseInt(countAB) || 0) + (parseInt(countBA) || 0) - (parseInt(countABi) || 0))}`}
                          className="text-sm"
                        />
                      </CardContent>
                    </Card>
                  </motion.div>

                  <ResultCard title="Counting Result" rows={count2Rows} />
                </motion.div>
              ) : (
                <motion.div
                  key="count3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <Card className="shadow-sm border-border/60">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground font-medium" style={mathFont}>|A|</label>
                          <Input type="number" value={countCA} onChange={(e) => setCountCA(e.target.value)} className="mt-1 h-10 rounded-xl text-center number-math" style={mathFont} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium" style={mathFont}>|B|</label>
                          <Input type="number" value={countCB} onChange={(e) => setCountCB(e.target.value)} className="mt-1 h-10 rounded-xl text-center number-math" style={mathFont} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium" style={mathFont}>|C|</label>
                          <Input type="number" value={countCC} onChange={(e) => setCountCC(e.target.value)} className="mt-1 h-10 rounded-xl text-center number-math" style={mathFont} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground font-medium" style={mathFont}>|A∩B|</label>
                          <Input type="number" value={countABiC} onChange={(e) => setCountABiC(e.target.value)} className="mt-1 h-10 rounded-xl text-center number-math" style={mathFont} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium" style={mathFont}>|A∩C|</label>
                          <Input type="number" value={countACiB} onChange={(e) => setCountACiB(e.target.value)} className="mt-1 h-10 rounded-xl text-center number-math" style={mathFont} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium" style={mathFont}>|B∩C|</label>
                          <Input type="number" value={countBCiA} onChange={(e) => setCountBCiA(e.target.value)} className="mt-1 h-10 rounded-xl text-center number-math" style={mathFont} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium" style={mathFont}>|A∩B∩C|</label>
                          <Input type="number" value={countABC} onChange={(e) => setCountABC(e.target.value)} className="mt-1 h-10 rounded-xl text-center number-math" style={mathFont} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 3-set Venn */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="shadow-sm border-emerald-200/40 dark:border-emerald-800/30 overflow-hidden">
                      <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300" />
                      <CardContent className="p-4">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 mb-3">
                          3-Set Venn Diagram
                        </p>
                        <VennDiagram3 {...count3Regions} />
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Formula */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="math-display">
                    <Card className="shadow-sm border-emerald-200/40 dark:border-emerald-800/30 overflow-hidden">
                      <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300" />
                      <CardContent className="p-4 space-y-2">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400">Inclusion-Exclusion (3 sets)</p>
                        <KaTeXRenderer latex={`|A \\cup B \\cup C| = |A| + |B| + |C| - |A \\cap B| - |A \\cap C| - |B \\cap C| + |A \\cap B \\cap C|`} className="text-sm" />
                        <KaTeXRenderer
                          latex={`= ${countCA} + ${countCB} + ${countCC} - ${countABiC} - ${countACiB} - ${countBCiA} + ${countABC} = ${
                            (parseInt(countCA) || 0) + (parseInt(countCB) || 0) + (parseInt(countCC) || 0)
                            - (parseInt(countABiC) || 0) - (parseInt(countACiB) || 0) - (parseInt(countBCiA) || 0)
                            + (parseInt(countABC) || 0)
                          }`}
                          className="text-sm"
                        />
                      </CardContent>
                    </Card>
                  </motion.div>

                  <ResultCard title="Counting Result" rows={count3Rows} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}