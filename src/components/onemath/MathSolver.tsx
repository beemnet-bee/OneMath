'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Camera, ImagePlus, Loader2, ChevronDown, ChevronUp, Sparkles, RotateCcw, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useOneMathStore } from '@/stores/onemath-store';
import KaTeXRenderer from './KaTeXRenderer';

interface SolveResult {
  answer: string;
  steps: string[];
  latex: string[];
}

const examples = [
  'Solve x² + 5x + 6 = 0',
  'What is 15% of 240?',
  'Derivative of x³ + 2x² - 5x + 3',
  'A train travels 120km in 2 hours. What is the speed?',
  '∫(2x + 1)dx',
  'lim(x→0) sin(x)/x',
];

export default function MathSolver() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToHistory } = useOneMathStore();

  const handleSolve = async () => {
    if (!input.trim() && !imageBase64) return;
    setLoading(true);
    setResult(null);

    try {
      if (imageBase64) {
        const res = await fetch('/api/solve-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageBase64 }),
        });
        const data = await res.json();
        setResult(data);
        addToHistory({
          type: 'Image',
          input: imagePreview ? 'Photo problem' : 'Uploaded image',
          output: data.answer || data.detected_equation || 'Solved',
        });
      } else {
        const res = await fetch(`/api/solve?equation=${encodeURIComponent(input)}`);
        const data = await res.json();
        setResult(data);
        addToHistory({
          type: 'Solve',
          input: input.trim(),
          output: data.answer || 'Solved',
        });
      }
    } catch {
      setResult({ answer: 'Failed to solve. Please try again.', steps: [], latex: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const reset = () => {
    setInput('');
    setResult(null);
    setExpandedStep(null);
    clearImage();
    setCopied(false);
  };

  const copyAnswer = async () => {
    if (result?.answer) {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Input Section */}
      <Card className="border-emerald-200/40 dark:border-emerald-800/25 shadow-sm card-border-hover">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">AI Math Solver</span>
            <span className="badge-pill text-[9px] ml-auto">Ctrl+Enter</span>
          </div>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a math problem... (equations, word problems, calculus)"
            className="min-h-[100px] resize-none text-sm border-emerald-200/60 dark:border-emerald-800/40 focus-visible:ring-emerald-500/40"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSolve();
            }}
          />

          {/* Image Preview */}
          <AnimatePresence>
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative rounded-xl overflow-hidden border border-border"
              >
                <img src={imagePreview} alt="Math problem" className="w-full max-h-48 object-contain bg-muted/50 rounded-xl" />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-10 w-10"
              onClick={() => fileInputRef.current?.click()}
              title="Upload image"
            >
              <ImagePlus className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-10 w-10"
              onClick={() => {
                const input2 = document.createElement('input');
                input2.type = 'file';
                input2.accept = 'image/*';
                input2.capture = 'environment';
                input2.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleImageUpload(file);
                };
                input2.click();
              }}
              title="Take photo"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSolve}
              disabled={loading || (!input.trim() && !imageBase64)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 shadow-sm"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Solving...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Solve</>
              )}
            </Button>
            {(input || result) && (
              <Button variant="ghost" size="icon" onClick={reset} title="Reset" className="h-10 w-10 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      {!result && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-muted-foreground mb-2.5 font-semibold">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex, i) => (
              <motion.button
                key={ex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setInput(ex)}
                className="text-[11px] px-3 py-1.5 bg-card border border-border/60 rounded-full hover:border-emerald-400/50 dark:hover:border-emerald-600/50 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 transition-all text-foreground hover:shadow-md font-medium"
              >
                {ex}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Answer */}
            <Card className="border-emerald-300/50 dark:border-emerald-700/30 bg-gradient-to-br from-emerald-50/60 via-card to-teal-50/30 dark:from-emerald-950/20 dark:via-card dark:to-teal-950/10 shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300" />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Answer</p>
                  </div>
                  <button
                    onClick={copyAnswer}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div
                  className="text-lg font-semibold text-foreground leading-relaxed"
                  style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                >
                  {result.answer}
                </div>
              </CardContent>
            </Card>

            {/* Steps */}
            {result.steps.length > 0 && (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Step-by-Step Solution
                  </p>
                  <div className="space-y-2">
                    {result.steps.map((step, i) => (
                      <div
                        key={i}
                        className="border border-border/60 rounded-xl overflow-hidden hover:border-border transition-colors"
                      >
                        <button
                          onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                          className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm text-foreground">{step}</span>
                          </div>
                          {expandedStep === i ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </button>
                        <AnimatePresence>
                          {expandedStep === i && result.latex?.[i] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3.5 pb-3 pt-1">
                                <div className="math-display">
                                  <KaTeXRenderer latex={result.latex[i]} className="text-base" />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}