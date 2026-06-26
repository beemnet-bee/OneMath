'use client';

import { useState } from 'react';
import { evaluate } from 'mathjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const buttons = [
  ['sin', 'cos', 'tan', 'π'],
  ['asin', 'acos', 'atan', 'e'],
  ['log', 'ln', '√', '^'],
  ['(', ')', '!', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

export default function ScientificCalculator() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);

  const handleButton = (btn: string) => {
    if (btn === '⌫') {
      if (expression.length > 0) {
        setExpression(expression.slice(0, -1));
      }
      return;
    }

    if (btn === '=') {
      try {
        let expr = expression
          .replace(/π/g, 'pi')
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/(\d+)!/g, 'factorial($1)')
          .replace(/\^/g, '^');

        const result = evaluate(expr);
        setDisplay(String(result));
        setExpression(String(result));
        setIsNewNumber(true);
      } catch {
        setDisplay('Error');
      }
      return;
    }

    if (btn === 'C') {
      setDisplay('0');
      setExpression('');
      setIsNewNumber(true);
      return;
    }

    const isOp = ['+', '-', '×', '÷', '^'].includes(btn);
    const isFunc = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', '√', '!'].includes(btn);

    if (isFunc) {
      const funcMap: Record<string, string> = {
        'sin': 'sin(', 'cos': 'cos(', 'tan': 'tan(',
        'asin': 'asin(', 'acos': 'acos(', 'atan': 'atan(',
        'log': 'log10(', 'ln': 'log(', '√': 'sqrt(',
      };
      if (btn === '!') {
        setExpression(prev => prev + '!');
        setDisplay(prev => prev + '!');
      } else {
        setExpression(prev => prev + (funcMap[btn] || btn));
        setDisplay(funcMap[btn] || btn);
      }
      setIsNewNumber(true);
    } else if (isOp) {
      setExpression(prev => prev + btn);
      setIsNewNumber(true);
    } else if (btn === 'π') {
      setExpression(prev => prev + 'pi');
      setDisplay('π');
      setIsNewNumber(true);
    } else if (btn === 'e') {
      setExpression(prev => prev + 'e');
      setDisplay('e');
      setIsNewNumber(true);
    } else if (btn === '(' || btn === ')') {
      setExpression(prev => prev + btn);
      setDisplay(btn);
      setIsNewNumber(true);
    } else {
      if (isNewNumber) {
        setDisplay(btn);
        setIsNewNumber(false);
      } else {
        setDisplay(prev => prev + btn);
      }
      setExpression(prev => prev + btn);
    }
  };

  return (
    <div className="px-4 py-4 space-y-3">
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-4">
          {/* Display */}
          <div className="bg-gradient-to-b from-muted/80 to-muted/40 rounded-xl p-4 mb-3 border border-border/50">
            <p className="text-xs text-muted-foreground truncate h-4 font-mono">{expression || ' '}</p>
            <p
              className="text-3xl font-bold text-right text-foreground truncate mt-1 number-math"
            >
              {display}
            </p>
          </div>

          {/* Clear buttons */}
          <div className="flex gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={() => handleButton('C')} className="text-destructive flex-1 h-9 font-semibold">AC</Button>
            <Button variant="outline" size="sm" onClick={() => handleButton('⌫')} className="flex-1 h-9 font-semibold">⌫</Button>
          </div>

          {/* Calculator grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {buttons.flat().map((btn, i) => {
              const isOp = ['+', '-', '×', '÷', '^'].includes(btn);
              const isFunc = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', '√', '!'].includes(btn);
              const isSpecial = ['π', 'e', '(', ')'].includes(btn);
              const isEquals = btn === '=';

              return (
                <button
                  key={i}
                  onClick={() => handleButton(btn)}
                  className={`h-11 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    isEquals
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                      : isOp
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                        : isFunc || isSpecial
                          ? 'bg-muted text-foreground hover:bg-muted/80'
                          : 'bg-card border border-border text-foreground hover:bg-muted/50'
                  }`}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}