'use client';

import { motion } from 'framer-motion';

interface FeatureHeaderProps {
  icon: string;
  title: string;
  description?: string;
  gradient?: string;
}

export default function FeatureHeader({ icon, title, description, gradient = 'from-emerald-500 to-teal-600' }: FeatureHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center gap-3.5 pb-4 mb-4 border-b border-border/30"
    >
      <motion.div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg relative overflow-hidden ripple-effect`}
        whileHover={{ scale: 1.08, rotate: -3 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        {/* Inner highlight — double layer for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        <span
          className="text-white text-lg font-bold drop-shadow-sm relative z-10"
          style={{ fontFamily: "'Latin Modern Math', 'STIX Two Math', serif" }}
        >
          {icon}
        </span>
      </motion.div>
      <div className="min-w-0 flex-1">
        <h2 className="text-[17px] font-extrabold text-foreground leading-tight tracking-tight">{title}</h2>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug font-medium truncate">{description}</p>
        )}
      </div>
      {/* Subtle decorative dot */}
      <div className="w-2 h-2 rounded-full bg-emerald-500/20 dark:bg-emerald-400/15 shrink-0 pulse-dot" />
    </motion.div>
  );
}