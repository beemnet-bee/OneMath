'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeatureHeader from '../FeatureHeader';
import ResultCard from '../ResultCard';
import { useOneMathStore } from '@/stores/onemath-store';

type MatrixOp = 'det' | 'transpose' | 'inverse' | 'add' | 'multiply';

export default function MatrixCalculator() {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [matrixA, setMatrixA] = useState<number[][]>([[1, 2], [3, 4]]);
  const [matrixB, setMatrixB] = useState<number[][]>([[5, 6], [7, 8]]);
  const [resultRows, setResultRows] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);
  const { addToHistory } = useOneMathStore();

  const resizeMatrix = (r: number, c: number) => {
    setRows(r); setCols(c);
    const newA: number[][] = Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => matrixA[i]?.[j] ?? 0)
    );
    const newB: number[][] = Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => matrixB[i]?.[j] ?? 0)
    );
    setMatrixA(newA); setMatrixB(newB);
  };

  const updateCell = (m: 'A' | 'B', r: number, c: number, val: string) => {
    const matrix = m === 'A' ? [...matrixA.map(r2 => [...r2])] : [...matrixB.map(r2 => [...r2])];
    matrix[r][c] = parseFloat(val) || 0;
    if (m === 'A') setMatrixA(matrix); else setMatrixB(matrix);
  };

  const det = (m: number[][]): number => {
    if (m.length === 1) return m[0][0];
    if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    let d = 0;
    for (let j = 0; j < m[0].length; j++) {
      const sub = m.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)]);
      d += (j % 2 === 0 ? 1 : -1) * m[0][j] * det(sub);
    }
    return d;
  };

  const transpose = (m: number[][]): number[][] => m[0].map((_, j) => m.map(row => row[j]));

  const multiply = (a: number[][], b: number[][]): number[][] => {
    return a.map(row => b[0].map((_, j) => row.reduce((sum, val, k) => sum + val * b[k][j], 0)));
  };

  const add = (a: number[][], b: number[][]): number[][] => a.map((row, i) => row.map((val, j) => val + b[i][j]));

  const inverse = (m: number[][]): number[][] | string => {
    const d = det(m);
    if (d === 0) return 'Singular matrix (no inverse)';
    if (m.length === 2) {
      return [[m[1][1] / d, -m[0][1] / d], [-m[1][0] / d, m[0][0] / d]];
    }
    return 'Use 2×2 for inverse calculation';
  };

  const rank = (m: number[][]): number => {
    const ref = m.map(r => [...r]);
    let r = 0;
    for (let col = 0; col < ref[0].length && r < ref.length; col++) {
      let pivot = -1;
      for (let row = r; row < ref.length; row++) {
        if (Math.abs(ref[row][col]) > 1e-10) { pivot = row; break; }
      }
      if (pivot === -1) continue;
      [ref[r], ref[pivot]] = [ref[pivot], ref[r]];
      const scale = ref[r][col];
      for (let j = col; j < ref[0].length; j++) ref[r][j] /= scale;
      for (let row = 0; row < ref.length; row++) {
        if (row !== r && Math.abs(ref[row][col]) > 1e-10) {
          const factor = ref[row][col];
          for (let j = col; j < ref[0].length; j++) ref[row][j] -= factor * ref[r][j];
        }
      }
      r++;
    }
    return r;
  };

  const operate = (op: MatrixOp) => {
    try {
      switch (op) {
        case 'det': {
          const d = det(matrixA);
          setResultRows([{ label: 'det(A)', value: String(d), highlight: true }]);
          addToHistory({ type: 'Matrix', input: `${rows}×${cols} determinant`, output: String(d) });
          break;
        }
        case 'transpose': {
          const t = transpose(matrixA);
          setResultRows([{ label: 'Aᵀ', value: JSON.stringify(t), highlight: true }]);
          break;
        }
        case 'inverse': {
          const inv = inverse(matrixA);
          setResultRows([{ label: 'A⁻¹', value: typeof inv === 'string' ? inv : JSON.stringify(inv), highlight: true }]);
          break;
        }
        case 'add': {
          const s = add(matrixA, matrixB);
          setResultRows([{ label: 'A + B', value: JSON.stringify(s), highlight: true }]);
          break;
        }
        case 'multiply': {
          if (matrixA[0].length !== matrixB.length) {
            setResultRows([{ label: 'Error', value: 'Column count of A must equal row count of B' }]);
          } else {
            const p = multiply(matrixA, matrixB);
            setResultRows([{ label: 'A × B', value: JSON.stringify(p), highlight: true }]);
          }
          break;
        }
      }
    } catch (e) {
      setResultRows([{ label: 'Error', value: String(e) }]);
    }
  };

  const MatrixInput = ({ label, matrix, m }: { label: string; matrix: number[][]; m: 'A' | 'B' }) => (
    <div>
      <p className="text-xs font-medium text-foreground mb-1.5">{label}</p>
      <div className="flex gap-1">
        <span className="text-2xl text-muted-foreground self-center font-light">[</span>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {matrix.flat().map((val, idx) => {
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            return (
              <Input
                key={`${m}-${r}-${c}`}
                type="number"
                value={val}
                onChange={(e) => updateCell(m, r, c, e.target.value)}
                className="w-14 h-8 text-center text-xs rounded-xl"
              />
            );
          })}
        </div>
        <span className="text-2xl text-muted-foreground self-center font-light">]</span>
      </div>
    </div>
  );

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="🔢"
        title="Matrix Calculator"
        description="2×2 and 3×3: det, inverse, transpose, multiply, rank"
        gradient="from-green-500 to-emerald-600"
      />

      <div className="flex gap-2 items-center">
        <span className="text-xs text-muted-foreground">Size:</span>
        {[2, 3].map(n => (
          <Button
            key={n}
            variant={rows === n ? 'default' : 'outline'}
            size="sm"
            className="h-10 text-xs"
            onClick={() => resizeMatrix(n, n)}
          >
            {n}×{n}
          </Button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-4 space-y-4">
            <MatrixInput label="Matrix A" matrix={matrixA} m="A" />
            <MatrixInput label="Matrix B" matrix={matrixB} m="B" />

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => operate('det')} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl shadow-sm shadow-emerald-500/20">Determinant</Button>
              <Button size="sm" onClick={() => operate('transpose')} variant="outline" className="h-10 text-xs">Transpose A</Button>
              <Button size="sm" onClick={() => operate('inverse')} variant="outline" className="h-10 text-xs">Inverse A</Button>
              <Button size="sm" onClick={() => operate('add')} variant="outline" className="h-10 text-xs">A + B</Button>
              <Button size="sm" onClick={() => operate('multiply')} variant="outline" className="h-10 text-xs">A × B</Button>
              <Button size="sm" onClick={() => setResultRows([{ label: 'rank(A)', value: String(rank(matrixA)), highlight: true }])} variant="outline" className="h-10 text-xs">Rank A</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <ResultCard title="Result" rows={resultRows} />
    </div>
  );
}