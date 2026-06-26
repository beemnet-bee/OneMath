'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, X, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formulas, formulaCategories, type Formula } from '@/data/formulas';
import { useOneMathStore } from '@/stores/onemath-store';
import KaTeXRenderer from './KaTeXRenderer';

export default function FormulaDictionary() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const { favorites, toggleFavorite } = useOneMathStore();

  const filteredFormulas = useMemo(() => {
    let results: Formula[] = formulas;

    if (showFavorites) {
      results = results.filter((f) => favorites.includes(f.id));
    }

    if (activeCategory !== 'all') {
      results = results.filter((f) => f.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.keywords.some((k) => k.includes(q))
      );
    }

    return results;
  }, [search, activeCategory, showFavorites, favorites]);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-emerald-500" />
        <h2 className="text-lg font-bold text-foreground">Formula Dictionary</h2>
        <span className="text-xs text-muted-foreground ml-auto">{formulas.length} formulas</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search formulas..."
          className="pl-9 h-10 bg-card border-border"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {formulaCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setShowFavorites(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id && !showFavorites
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
        <button
          onClick={() => { setShowFavorites(!showFavorites); if (showFavorites) setActiveCategory('all'); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            showFavorites
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className={`w-3 h-3 ${showFavorites ? 'fill-current' : ''}`} />
          Favorites
        </button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filteredFormulas.length} formula{filteredFormulas.length !== 1 ? 's' : ''} found
        </p>
        {activeCategory !== 'all' && (
          <button
            onClick={() => setActiveCategory('all')}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Formula Cards */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredFormulas.map((formula, i) => {
            const isFav = favorites.includes(formula.id);
            const catInfo = formulaCategories.find((c) => c.id === formula.category);
            return (
              <motion.div
                key={formula.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className="formula-card overflow-hidden">
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">{formula.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {catInfo?.icon} {catInfo?.name}
                          </Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(formula.id)}
                        className="shrink-0 p-1 rounded-md hover:bg-muted/60 transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${
                            isFav ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-400'
                          }`}
                        />
                      </button>
                    </div>

                    {/* LaTeX Formula — Latin Modern Math display */}
                    <div className="math-display mb-2.5">
                      <KaTeXRenderer latex={formula.latex} className="text-sm" />
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{formula.description}</p>

                    {/* Keywords */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {formula.keywords.slice(0, 4).map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] px-2 py-0.5 bg-muted/80 rounded-full text-muted-foreground"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredFormulas.length === 0 && (
          <div className="text-center py-16">
            <div className="text-3xl mb-3">🔍</div>
            <p className="text-muted-foreground text-sm font-medium">No formulas found</p>
            <p className="text-muted-foreground text-xs mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}