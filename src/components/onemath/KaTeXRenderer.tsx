'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';

interface Props {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export default function KaTeXRenderer({ latex, displayMode = true, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current && latex) {
      try {
        katex.render(latex, ref.current, {
          displayMode,
          throwOnError: false,
          trust: true,
          strict: false,
          // Let CSS handle the font — Latin Modern Math
          output: 'html',
        });
      } catch {
        ref.current.textContent = latex;
      }
    }
  }, [latex, displayMode]);

  return <span ref={ref} className={`${className}`} />;
}