'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Trash2, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import FeatureHeader from '../FeatureHeader';
import { evaluate } from 'mathjs';

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  isError: boolean;
  timestamp: Date;
}

interface LineResult {
  line: string;
  result: string;
  isError: boolean;
}

const TOOLBAR_BUTTONS = [
  { label: '√', insert: 'sqrt(' },
  { label: 'π', insert: 'pi' },
  { label: 'e', insert: 'e' },
  { label: 'x²', insert: '^2' },
  { label: 'sin()', insert: 'sin(' },
  { label: 'cos()', insert: 'cos(' },
  { label: 'tan()', insert: 'tan(' },
  { label: 'log()', insert: 'log(' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
];

function formatResult(value: unknown): string {
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toString();
    if (Math.abs(value) > 1e10 || (Math.abs(value) < 1e-6 && value !== 0)) {
      return value.toExponential(6);
    }
    return parseFloat(value.toPrecision(12)).toString();
  }
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function evaluateLines(text: string): LineResult[] {
  const lines = text.split('\n');
  const scope: Record<string, unknown> = {};
  const results: LineResult[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      results.push({ line, result: '', isError: false });
      continue;
    }

    // Check for variable assignment: x = 5 or x = 5 + 3
    const assignMatch = trimmed.match(/^(?!pi$|e$)([a-zA-Z_]\w*)\s*=\s*(.+)$/);

    try {
      if (assignMatch) {
        const varName = assignMatch[1];
        const expr = assignMatch[2];
        const value = evaluate(expr, scope);
        scope[varName] = value;
        const display = formatResult(value);
        results.push({
          line,
          result: `${varName} = ${display}`,
          isError: false,
        });
      } else {
        const value = evaluate(trimmed, scope);
        const display = formatResult(value);
        results.push({ line, result: `= ${display}`, isError: false });
      }
    } catch {
      results.push({ line, result: 'Invalid expression', isError: true });
    }
  }

  return results;
}

export default function MathScratchpad() {
  const [text, setText] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Evaluate each line in real-time — scope is rebuilt from text each render
  const lineResults = evaluateLines(text);

  // Add current lines to history on specific trigger (Ctrl+Enter)
  const addToHistory = useCallback(() => {
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length === 0) return;

    const newEntries: HistoryEntry[] = lines.map((line) => {
      const trimmed = line.trim();
      const result = lineResults.find((r) => r.line === line);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        expression: trimmed,
        result: result?.isError ? 'Error' : result?.result || '',
        isError: result?.isError ?? false,
        timestamp: new Date(),
      };
    });

    setHistory((prev) => [...prev, ...newEntries]);
    setShowHistory(true);
  }, [text, lineResults]);

  // Scroll history to bottom when new entries are added
  useEffect(() => {
    if (showHistory && historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, showHistory]);

  // Ctrl+Enter to save to history
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addToHistory();
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    return () => textarea.removeEventListener('keydown', handleKeyDown);
  }, [addToHistory]);

  const insertAtCursor = useCallback((insertText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = text.slice(0, start);
    const after = text.slice(end);

    setText(before + insertText + after);

    // Restore cursor position
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + insertText.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  }, [text]);

  const handleClearAll = useCallback(() => {
    setText('');
  }, []);

  const handleCopyAll = useCallback(async () => {
    const lines = lineResults
      .filter((r) => r.line.trim())
      .map((r) => `${r.line.trim()} ${r.result}`)
      .join('\n');

    if (!lines) return;

    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  }, [lineResults]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const lineCount = text.split('\n').filter((l) => l.trim()).length;
  const evalCount = lineResults.filter((r) => r.result && r.line.trim()).length;

  return (
    <div className="px-4 py-4 space-y-4">
      <FeatureHeader
        icon="📝"
        title="Math Scratchpad"
        description="Freeform live-evaluation workspace"
        gradient="from-emerald-500 to-teal-600"
      />

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {TOOLBAR_BUTTONS.map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => insertAtCursor(btn.insert)}
                  className="h-8 px-2.5 rounded-lg text-sm font-medium bg-muted/60 text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150 active:scale-95"
                  style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                  title={`Insert ${btn.insert}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Textarea + Live Results */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <Card className="bg-card border border-border">
          <CardContent className="p-3 space-y-2">
            {/* Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type math expressions, one per line...&#10;&#10;Examples:&#10;2 + 3 * 4&#10;x = 10&#10;sqrt(x) + pi&#10;sin(pi / 4)"
                rows={8}
                className="w-full resize-y rounded-xl bg-muted/60 border border-emerald-200/60 dark:border-emerald-800/40 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 p-3 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/60 dark:bg-muted/40 leading-relaxed"
                style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', 'SF Mono', 'Fira Code', monospace" }}
              />
            </div>

            {/* Line stats */}
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">{lineCount}</span> lines ·{' '}
                <span className="font-medium text-emerald-500">{evalCount}</span> evaluated
              </p>
              <p className="text-[11px] text-muted-foreground">
                Ctrl+Enter → save to history
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Evaluation Results */}
        {lineResults.some((r) => r.line.trim() && r.result) && (
          <Card className="bg-card border border-border">
            <CardContent className="p-3 space-y-0">
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <h3 className="text-xs font-bold text-foreground">Live Results</h3>
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {lineResults.map((r, i) => {
                  if (!r.line.trim()) return null;
                  if (!r.result) return null;

                  return (
                    <motion.div
                      key={`${r.line}-${i}`}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <span
                        className="text-xs text-muted-foreground mt-px shrink-0 w-5 text-right font-mono"
                        style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm text-foreground truncate font-mono"
                          style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', 'SF Mono', 'Fira Code', monospace" }}
                        >
                          {r.line.trim()}
                        </p>
                        {r.isError ? (
                          <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {r.result}
                          </p>
                        ) : (
                          <p
                            className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5"
                            style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                          >
                            {r.result}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2"
      >
        <button
          onClick={handleCopyAll}
          disabled={lineCount === 0}
          className="flex-1 h-10 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy All
            </>
          )}
        </button>
        <button
          onClick={addToHistory}
          disabled={lineCount === 0}
          className="flex-1 h-10 rounded-lg text-sm font-medium bg-muted/60 text-foreground hover:bg-muted active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed border border-border"
        >
          Save to History
        </button>
        <button
          onClick={handleClearAll}
          disabled={lineCount === 0}
          className="h-10 px-4 rounded-lg text-sm font-medium bg-muted/60 text-red-500 hover:bg-red-500/10 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed border border-border"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Session History Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm font-medium text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <Clock className="w-4 h-4" />
          Session History
          {history.length > 0 && (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
              {history.length}
            </span>
          )}
        </button>
      </motion.div>

      {/* Session History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="bg-card border border-border">
              <CardContent className="p-3 space-y-2">
                {history.length > 0 && (
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{history.length}</span> entries
                    </p>
                    <button
                      onClick={handleClearHistory}
                      className="text-[11px] text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                    >
                      Clear History
                    </button>
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">No history yet</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Press Ctrl+Enter or &quot;Save to History&quot; to record expressions
                      </p>
                    </div>
                  ) : (
                    history.map((entry, idx) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                        className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                      >
                        <span
                          className="text-[10px] text-muted-foreground mt-1 shrink-0 font-mono"
                        >
                          {formatTime(entry.timestamp)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs text-foreground truncate"
                            style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', 'SF Mono', 'Fira Code', monospace" }}
                          >
                            {entry.expression}
                          </p>
                          {entry.isError ? (
                            <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1 mt-0.5">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              Error
                            </p>
                          ) : (
                            <p
                              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5"
                              style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
                            >
                              {entry.result}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={historyEndRef} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-muted/40 rounded-xl p-3 border border-border/30 space-y-1.5"
      >
        <p className="text-[11px] font-semibold text-foreground">Tips</p>
        <ul className="text-[11px] text-muted-foreground space-y-1">
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-500 mt-px">•</span>
            <span>Assign variables: <code className="text-foreground bg-muted/60 px-1 rounded">x = 5</code> then use in next lines</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-500 mt-px">•</span>
            <span>Use <code className="text-foreground bg-muted/60 px-1 rounded">pi</code>, <code className="text-foreground bg-muted/60 px-1 rounded">e</code>, <code className="text-foreground bg-muted/60 px-1 rounded">sqrt()</code>, <code className="text-foreground bg-muted/60 px-1 rounded">sin()</code>, <code className="text-foreground bg-muted/60 px-1 rounded">log()</code></span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-500 mt-px">•</span>
            <span>Powers: <code className="text-foreground bg-muted/60 px-1 rounded">2^10</code> → 1024</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-500 mt-px">•</span>
            <span>Empty lines are ignored — use them to separate work</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}