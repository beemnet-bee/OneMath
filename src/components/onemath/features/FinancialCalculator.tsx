'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';
import KaTeXRenderer from '../KaTeXRenderer';

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (n: number) => n.toFixed(2) + '%';

const FREQ_MAP: Record<string, number> = {
  annually: 1,
  semi: 2,
  quarterly: 4,
  monthly: 12,
  daily: 365,
};

const FREQ_LABEL: Record<string, string> = {
  annually: 'Annually',
  semi: 'Semi-annually',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
  daily: 'Daily',
};

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

interface CIBreakdownRow {
  year: number;
  value: number;
  totalInterest: number;
  yearInterest: number;
  growthPct: number;
}

interface CompoundResult {
  futureValue: number;
  totalInterest: number;
  effectiveRate: number;
  compFreq: number;
  breakdown: CIBreakdownRow[];
}

interface AmortRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  isLast: boolean;
}

interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  principalPct: number;
  interestPct: number;
  totalMonths: number;
  schedule: AmortRow[];
}

interface PVFVResult {
  value: number;
  totalContributions: number;
  totalInterest: number;
  steps: string[];
}

interface ROIResult {
  profit: number;
  profitPct: number;
  cagr: number;
  breakEven: number;
  isProfit: boolean;
  cost: number;
  sell: number;
  hold: number;
  multiplier: number;
}

/* ═══════════════════════════════════════════════════════════════
   SVG Pie Chart (declared outside component to avoid re-creation)
   ═══════════════════════════════════════════════════════════════ */

function PieChart({ principalPct, interestPct }: { principalPct: number; interestPct: number }) {
  const R = 60, cx = 80, cy = 80;
  const pAngle = (principalPct / 100) * 2 * Math.PI;
  const x1 = cx + R * Math.cos(-Math.PI / 2), y1 = cy + R * Math.sin(-Math.PI / 2);
  const x2 = cx + R * Math.cos(-Math.PI / 2 + pAngle), y2 = cy + R * Math.sin(-Math.PI / 2 + pAngle);
  const la = pAngle > Math.PI ? 1 : 0;
  const m1 = -Math.PI / 2 + pAngle / 2, m2 = -Math.PI / 2 + pAngle + (2 * Math.PI - pAngle) / 2;
  const lr = R * 0.55;

  return (
    <svg viewBox="0 0 160 160" className="w-40 h-40 mx-auto">
      <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${la} 1 ${x2} ${y2} Z`} fill="#10b981" />
      <path d={`M ${cx} ${cy} L ${x2} ${y2} A ${R} ${R} 0 ${1 - (la as 0 | 1)} 1 ${x1} ${y1} Z`} fill="#f59e0b" />
      <text x={cx + lr * Math.cos(m1)} y={cy + lr * Math.sin(m1)} fill="white" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily: "'Latin Modern Math', serif" }}>{principalPct.toFixed(1)}%</text>
      <text x={cx + lr * Math.cos(m2)} y={cy + lr * Math.sin(m2)} fill="white" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily: "'Latin Modern Math', serif" }}>{interestPct.toFixed(1)}%</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════ */

export default function FinancialCalculator() {
  /* ── Compound Interest State ── */
  const [ciPrincipal, setCiPrincipal] = useState('10000');
  const [ciRate, setCiRate] = useState('7');
  const [ciYears, setCiYears] = useState('10');
  const [ciFreq, setCiFreq] = useState('monthly');
  const [ciResult, setCiResult] = useState<CompoundResult | null>(null);

  /* ── Loan Amortization State ── */
  const [laAmount, setLaAmount] = useState('250000');
  const [laRate, setLaRate] = useState('6.5');
  const [laMonths, setLaMonths] = useState('360');
  const [laResult, setLaResult] = useState<LoanResult | null>(null);

  /* ── PV / FV State ── */
  const [pvMode, setPvMode] = useState<'pv' | 'fv'>('pv');
  const [pvPmt, setPvPmt] = useState('500');
  const [pvRate, setPvRate] = useState('5');
  const [pvPeriods, setPvPeriods] = useState('20');
  const [pvResult, setPvResult] = useState<PVFVResult | null>(null);

  /* ── ROI State ── */
  const [roiCost, setRoiCost] = useState('15000');
  const [roiSell, setRoiSell] = useState('19500');
  const [roiHold, setRoiHold] = useState('3');
  const [roiResult, setRoiResult] = useState<ROIResult | null>(null);

  /* ══════════════════════ Compound Interest ══════════════════════ */

  function calcCompound() {
    const P = parseFloat(ciPrincipal);
    const r = parseFloat(ciRate) / 100;
    const t = parseFloat(ciYears);
    const n = FREQ_MAP[ciFreq];
    if ([P, r, t, n].some(isNaN) || P <= 0 || t <= 0 || n <= 0) return;

    const A = P * Math.pow(1 + r / n, n * t);
    const interest = A - P;
    const ear = (Math.pow(1 + r / n, n) - 1) * 100;
    const maxYears = Math.min(Math.floor(t), 30);
    const breakdown: CIBreakdownRow[] = [];

    for (let y = 1; y <= maxYears; y++) {
      const val = P * Math.pow(1 + r / n, n * y);
      const prev = y === 1 ? P : P * Math.pow(1 + r / n, n * (y - 1));
      const yearInt = val - prev;
      breakdown.push({
        year: y,
        value: val,
        totalInterest: val - P,
        yearInterest: yearInt,
        growthPct: (yearInt / prev) * 100,
      });
    }

    setCiResult({ futureValue: A, totalInterest: interest, effectiveRate: ear, compFreq: n, breakdown });
  }

  /* ══════════════════════ Loan Amortization ══════════════════════ */

  function calcLoan() {
    const P = parseFloat(laAmount);
    const annualRate = parseFloat(laRate) / 100;
    const n = parseInt(laMonths);
    if ([P, annualRate, n].some(isNaN) || P <= 0 || n <= 0) return;

    const r = annualRate / 12;
    const M = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPay = M * n;
    const totalInt = totalPay - P;
    const schedule: AmortRow[] = [];
    let bal = P;

    // First 12 months
    for (let i = 1; i <= Math.min(n, 12); i++) {
      const intPart = bal * r;
      const prinPart = M - intPart;
      bal -= prinPart;
      schedule.push({ month: i, payment: M, principal: prinPart, interest: intPart, balance: Math.max(bal, 0), isLast: false });
    }

    // Last month (if loan > 12 months)
    if (n > 12) {
      let b = P;
      for (let i = 1; i < n; i++) b -= M - b * r;
      schedule.push({ month: n, payment: M, principal: b, interest: b * r, balance: 0, isLast: true });
    }

    setLaResult({
      monthlyPayment: M, totalPayment: totalPay, totalInterest: totalInt,
      principalPct: (P / totalPay) * 100, interestPct: (totalInt / totalPay) * 100,
      totalMonths: n, schedule,
    });
  }

  /* ══════════════════════ PV / FV of Annuity ══════════════════════ */

  function calcPVFV() {
    const PMT = parseFloat(pvPmt), r = parseFloat(pvRate) / 100, n = parseFloat(pvPeriods);
    if ([PMT, r, n].some(isNaN) || PMT === 0 || n <= 0) return;
    const steps: string[] = [];
    let value: number;

    if (pvMode === 'pv') {
      if (r === 0) {
        value = PMT * n;
        steps.push('Rate is 0%, so PV = PMT × n');
        steps.push(`PV = ${fmt(PMT)} × ${n} = ${fmt(value)}`);
      } else {
        const factor = Math.pow(1 + r, -n);
        const numerator = 1 - factor;
        const af = numerator / r;
        value = PMT * af;
        steps.push(`Given: PMT = ${fmt(PMT)},  r = ${pct(r)},  n = ${n}`);
        steps.push(`Step 1:  (1 + r) = ${(1 + r).toFixed(6)}`);
        steps.push(`Step 2:  (1 + r)^{-n} = ${factor.toFixed(8)}`);
        steps.push(`Step 3:  1 − (1+r)^{-n} = ${numerator.toFixed(8)}`);
        steps.push(`Step 4:  Annuity factor = ${numerator.toFixed(8)} ÷ ${r.toFixed(6)} = ${af.toFixed(6)}`);
        steps.push(`Step 5:  PV = ${fmt(PMT)} × ${af.toFixed(6)} = ${fmt(value)}`);
      }
    } else {
      if (r === 0) {
        value = PMT * n;
        steps.push('Rate is 0%, so FV = PMT × n');
        steps.push(`FV = ${fmt(PMT)} × ${n} = ${fmt(value)}`);
      } else {
        const factor = Math.pow(1 + r, n);
        const numerator = factor - 1;
        const af = numerator / r;
        value = PMT * af;
        steps.push(`Given: PMT = ${fmt(PMT)},  r = ${pct(r)},  n = ${n}`);
        steps.push(`Step 1:  (1 + r) = ${(1 + r).toFixed(6)}`);
        steps.push(`Step 2:  (1 + r)^n = ${factor.toFixed(8)}`);
        steps.push(`Step 3:  (1+r)^n − 1 = ${numerator.toFixed(8)}`);
        steps.push(`Step 4:  Annuity factor = ${numerator.toFixed(8)} ÷ ${r.toFixed(6)} = ${af.toFixed(6)}`);
        steps.push(`Step 5:  FV = ${fmt(PMT)} × ${af.toFixed(6)} = ${fmt(value)}`);
      }
    }

    setPvResult({ value, totalContributions: PMT * n, totalInterest: Math.abs(value - PMT * n), steps });
  }

  /* ══════════════════════ ROI & Profit ══════════════════════ */

  function calcROI() {
    const cost = parseFloat(roiCost), sell = parseFloat(roiSell), hold = parseFloat(roiHold);
    if ([cost, sell, hold].some(isNaN) || cost <= 0 || hold <= 0) return;
    const profit = sell - cost;
    const profitPct = (profit / cost) * 100;
    const cagr = (Math.pow(sell / cost, 1 / hold) - 1) * 100;
    setRoiResult({ profit, profitPct, cagr, breakEven: cost, isProfit: profit >= 0, cost, sell, hold, multiplier: sell / cost });
  }

  /* ══════════════════════ Shared Styles ══════════════════════ */

  const labelCls = 'text-xs text-muted-foreground font-medium';
  const inputCls = 'mt-1 h-10 rounded-xl text-sm';
  const btnCls = 'w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-500/20';
  const numFont = { fontFamily: "'Latin Modern Math', 'STIX Two Math', 'Times New Roman', serif" };

  /* ══════════════════════ Render ══════════════════════ */

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader icon="$" title="Financial Calculator" description="Compound interest, loans, PV/FV, ROI analysis" />

      <Tabs defaultValue="compound" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-9">
          <TabsTrigger value="compound" className="text-[11px]">Compound</TabsTrigger>
          <TabsTrigger value="loan" className="text-[11px]">Loan</TabsTrigger>
          <TabsTrigger value="pvfv" className="text-[11px]">PV / FV</TabsTrigger>
          <TabsTrigger value="roi" className="text-[11px]">ROI</TabsTrigger>
        </TabsList>

        {/* ═══════════════════════ COMPOUND INTEREST ═══════════════════════ */}
        <TabsContent value="compound" className="space-y-4 mt-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Principal (P)</label>
                    <Input type="number" value={ciPrincipal} onChange={e => setCiPrincipal(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcCompound()} />
                  </div>
                  <div>
                    <label className={labelCls}>Annual Rate (r %)</label>
                    <Input type="number" value={ciRate} onChange={e => setCiRate(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcCompound()} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Years (t)</label>
                    <Input type="number" value={ciYears} onChange={e => setCiYears(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcCompound()} />
                  </div>
                  <div>
                    <label className={labelCls}>Compounding</label>
                    <Select value={ciFreq} onValueChange={setCiFreq}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FREQ_MAP).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{FREQ_LABEL[key]} (n={val})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={calcCompound} className={btnCls}>Calculate Compound Interest</Button>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {ciResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="px-4 py-3 rounded-xl bg-muted/50">
                  <KaTeXRenderer latex="A = P\\left(1 + \\frac{r}{n}\\right)^{nt}" className="text-sm" />
                </div>
                <ResultCard title="Compound Interest Results" rows={[
                  { label: 'Future Value (A)', value: `$${fmt(ciResult.futureValue)}`, highlight: true },
                  { label: 'Total Interest Earned', value: `$${fmt(ciResult.totalInterest)}` },
                  { label: 'Effective Annual Rate', value: pct(ciResult.effectiveRate) },
                  { label: 'Compounding Frequency', value: `${ciResult.compFreq}× per year` },
                ]} />
                <Card className="shadow-sm border-border/60">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 mb-2">Year-by-Year Growth</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/40">
                            <th className="text-left py-1.5 text-muted-foreground font-semibold">Year</th>
                            <th className="text-right py-1.5 text-muted-foreground font-semibold">Value</th>
                            <th className="text-right py-1.5 text-muted-foreground font-semibold">Int. Earned</th>
                            <th className="text-right py-1.5 text-muted-foreground font-semibold">This Year</th>
                            <th className="text-right py-1.5 text-muted-foreground font-semibold">Growth</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ciResult.breakdown.map((row, i) => (
                            <tr key={row.year} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                              <td className="py-1.5 number-math" style={numFont}>{row.year}</td>
                              <td className="text-right py-1.5 number-math" style={numFont}>${fmt(row.value)}</td>
                              <td className="text-right py-1.5 number-math text-emerald-600 dark:text-emerald-400" style={numFont}>${fmt(row.totalInterest)}</td>
                              <td className="text-right py-1.5 number-math" style={numFont}>${fmt(row.yearInterest)}</td>
                              <td className="text-right py-1.5 number-math" style={numFont}>{pct(row.growthPct)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════════════ LOAN AMORTIZATION ═══════════════════════ */}
        <TabsContent value="loan" className="space-y-4 mt-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Loan Amount</label>
                    <Input type="number" value={laAmount} onChange={e => setLaAmount(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcLoan()} />
                  </div>
                  <div>
                    <label className={labelCls}>Annual Rate %</label>
                    <Input type="number" value={laRate} onChange={e => setLaRate(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcLoan()} />
                  </div>
                  <div>
                    <label className={labelCls}>Term (months)</label>
                    <Input type="number" value={laMonths} onChange={e => setLaMonths(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcLoan()} />
                  </div>
                </div>
                <Button onClick={calcLoan} className={btnCls}>Amortize Loan</Button>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {laResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="px-4 py-3 rounded-xl bg-muted/50">
                  <KaTeXRenderer latex="M = P\\frac{r(1+r)^{n}}{(1+r)^{n}-1}" className="text-sm" />
                </div>
                <ResultCard title="Loan Summary" rows={[
                  { label: 'Monthly Payment', value: `$${fmt(laResult.monthlyPayment)}`, highlight: true },
                  { label: 'Total Payment', value: `$${fmt(laResult.totalPayment)}` },
                  { label: 'Total Interest', value: `$${fmt(laResult.totalInterest)}` },
                  { label: 'Loan Term', value: `${laResult.totalMonths} months (${(laResult.totalMonths / 12).toFixed(1)} yrs)` },
                ]} />
                <Card className="shadow-sm border-border/60">
                  <CardContent className="p-4 flex flex-col items-center">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 mb-2">Principal vs Interest</p>
                    <PieChart principalPct={laResult.principalPct} interestPct={laResult.interestPct} />
                    <div className="flex gap-6 mt-2 text-xs">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Principal</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Interest</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border/60">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 mb-2">Amortization Schedule</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/40">
                            <th className="text-left py-1.5 text-muted-foreground font-semibold">Month</th>
                            <th className="text-right py-1.5 text-muted-foreground font-semibold">Payment</th>
                            <th className="text-right py-1.5 text-muted-foreground font-semibold">Principal</th>
                            <th className="text-right py-1.5 text-muted-foreground font-semibold">Interest</th>
                            <th className="text-right py-1.5 text-muted-foreground font-semibold">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {laResult.schedule.map((row, i) => (
                            <tr key={row.month} className={`${i % 2 === 0 ? 'bg-muted/30' : ''} ${row.isLast ? 'border-t-2 border-dashed border-border/50' : ''}`}>
                              <td className="py-1.5 number-math" style={numFont}>{row.isLast && laResult.totalMonths > 13 ? `… ${row.month}` : row.month}</td>
                              <td className="text-right py-1.5 number-math" style={numFont}>${fmt(row.payment)}</td>
                              <td className="text-right py-1.5 number-math text-emerald-600 dark:text-emerald-400" style={numFont}>${fmt(row.principal)}</td>
                              <td className="text-right py-1.5 number-math" style={numFont}>${fmt(row.interest)}</td>
                              <td className="text-right py-1.5 number-math" style={numFont}>${fmt(row.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {laResult.totalMonths > 13 && (
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">
                        Showing first 12 months and final payment of {laResult.totalMonths}-month loan
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════════════ PV / FV ═══════════════════════ */}
        <TabsContent value="pvfv" className="space-y-4 mt-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-2">
                  <Button variant={pvMode === 'pv' ? 'default' : 'outline'} size="sm"
                    className={pvMode === 'pv' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    onClick={() => { setPvMode('pv'); setPvResult(null); }}>Present Value</Button>
                  <Button variant={pvMode === 'fv' ? 'default' : 'outline'} size="sm"
                    className={pvMode === 'fv' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    onClick={() => { setPvMode('fv'); setPvResult(null); }}>Future Value</Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Payment (PMT)</label>
                    <Input type="number" value={pvPmt} onChange={e => setPvPmt(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcPVFV()} />
                  </div>
                  <div>
                    <label className={labelCls}>Rate %</label>
                    <Input type="number" value={pvRate} onChange={e => setPvRate(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcPVFV()} />
                  </div>
                  <div>
                    <label className={labelCls}>Periods (n)</label>
                    <Input type="number" value={pvPeriods} onChange={e => setPvPeriods(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcPVFV()} />
                  </div>
                </div>
                <Button onClick={calcPVFV} className={btnCls}>
                  Calculate {pvMode === 'pv' ? 'Present' : 'Future'} Value
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {pvResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="px-4 py-3 rounded-xl bg-muted/50">
                  <KaTeXRenderer
                    latex={pvMode === 'pv' ? 'PV = PMT \\times \\frac{1-(1+r)^{-n}}{r}' : 'FV = PMT \\times \\frac{(1+r)^{n}-1}{r}'}
                    className="text-sm" />
                </div>
                <ResultCard
                  title={pvMode === 'pv' ? 'Present Value of Annuity' : 'Future Value of Annuity'}
                  rows={[
                    { label: pvMode === 'pv' ? 'Present Value' : 'Future Value', value: `$${fmt(pvResult.value)}`, highlight: true },
                    { label: 'Total Contributions', value: `$${fmt(pvResult.totalContributions)}` },
                    { label: pvMode === 'pv' ? 'Interest Saved (Discount)' : 'Total Interest Earned', value: `$${fmt(pvResult.totalInterest)}` },
                  ]}
                />
                <Card className="shadow-sm border-border/60">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                      Step-by-Step Calculation
                    </p>
                    <div className="space-y-1.5">
                      {pvResult.steps.map((step, i) => (
                        <motion.p key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          className="text-xs text-foreground number-math" style={numFont}>{step}</motion.p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════════════ ROI & PROFIT ═══════════════════════ */}
        <TabsContent value="roi" className="space-y-4 mt-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Cost Price</label>
                    <Input type="number" value={roiCost} onChange={e => setRoiCost(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcROI()} />
                  </div>
                  <div>
                    <label className={labelCls}>Selling Price</label>
                    <Input type="number" value={roiSell} onChange={e => setRoiSell(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcROI()} />
                  </div>
                  <div>
                    <label className={labelCls}>Holding (years)</label>
                    <Input type="number" value={roiHold} onChange={e => setRoiHold(e.target.value)} className={inputCls} onKeyDown={e => e.key === 'Enter' && calcROI()} />
                  </div>
                </div>
                <Button onClick={calcROI} className={btnCls}>Calculate ROI</Button>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {roiResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="px-4 py-3 rounded-xl bg-muted/50">
                  <KaTeXRenderer latex="ROI = \\left(\\frac{\\text{Sell}}{\\text{Cost}}\\right)^{\\frac{1}{t}} - 1" className="text-sm" />
                </div>
                <ResultCard title="Profit & ROI Analysis" rows={[
                  { label: 'Profit / Loss', value: `${roiResult.isProfit ? '+' : '-'}$${fmt(Math.abs(roiResult.profit))}`, highlight: true },
                  { label: 'Profit / Loss %', value: `${roiResult.isProfit ? '+' : ''}${pct(roiResult.profitPct)}` },
                  { label: 'CAGR (Annualized)', value: pct(roiResult.cagr) },
                  { label: 'Investment Multiplier', value: `${roiResult.multiplier.toFixed(4)}×` },
                  { label: 'Break-even Price', value: `$${fmt(roiResult.breakEven)}` },
                  { label: 'Margin Above Break-even', value: `${roiResult.isProfit ? '+' : ''}$${fmt(roiResult.profit)}` },
                ]} />
                <Card className="shadow-sm border-border/60">
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 mb-2">Break-even Analysis</p>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Break-even price:</span>{' '}
                        <span className="number-math" style={numFont}>${fmt(roiResult.breakEven)}</span>
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Actual selling price:</span>{' '}
                        <span className="number-math" style={numFont}>${fmt(roiResult.sell)}</span>
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Variance:</span>{' '}
                        <span className={`number-math font-semibold ${roiResult.isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`} style={numFont}>
                          {roiResult.isProfit ? '+' : ''}${fmt(roiResult.profit)} ({pct(roiResult.profitPct)})
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Annualized (CAGR):</span>{' '}
                        <span className="number-math" style={numFont}>{pct(roiResult.cagr)}</span>
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Holding period:</span>{' '}
                        <span className="number-math" style={numFont}>{roiResult.hold} year{roiResult.hold !== 1 ? 's' : ''}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}