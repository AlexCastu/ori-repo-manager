import { motion } from 'framer-motion';

interface ProjectCardSkeletonProps {
  count?: number;
}

function SingleSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl project-card"
    >
      {/* Checkbox skeleton */}
      <div
        className="w-5 h-5 rounded-md animate-pulse bg-[var(--glass-border)]"
      />

      {/* Star skeleton */}
      <div
        className="w-6 h-6 rounded-xl animate-pulse bg-[var(--glass-border-light)]"
      />

      {/* Platform icon skeleton */}
      <div
        className="w-4 h-4 rounded animate-pulse bg-blue-500/20"
      />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title */}
        <div
          className="h-4 rounded-lg animate-pulse"
          style={{
            background: 'linear-gradient(90deg, var(--glass-border) 0%, var(--glass-border-light) 50%, var(--glass-border) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            width: `${60 + Math.random() * 30}%`
          }}
        />
        {/* URL */}
        <div
          className="h-3 rounded-lg animate-pulse"
          style={{
            background: 'linear-gradient(90deg, var(--glass-border-light) 0%, transparent 50%, var(--glass-border-light) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            width: `${70 + Math.random() * 25}%`
          }}
        />
      </div>

      {/* Status badge skeleton */}
      <div
        className="w-6 h-6 rounded-full animate-pulse bg-[var(--glass-border-light)]"
      />

      {/* Action buttons skeleton */}
      <div className="flex items-center gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-xl animate-pulse bg-[var(--glass-border-light)]"
          />
        ))}
      </div>
    </motion.div>
  );
}

export function ProjectCardSkeleton({ count = 5 }: ProjectCardSkeletonProps) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <SingleSkeleton key={index} index={index} />
      ))}

      {/* Global shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
