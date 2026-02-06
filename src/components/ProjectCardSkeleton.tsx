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
      className="flex flex-col gap-1.5 px-4 py-3 rounded-xl project-card"
    >
      {/* Row 1: Identity & Status */}
      <div className="flex items-center gap-2.5">
        {/* Checkbox */}
        <div className="w-5 h-5 rounded-md animate-pulse bg-[var(--border)]" />

        {/* Star */}
        <div className="w-6 h-6 rounded-lg animate-pulse bg-[var(--border-subtle)]" />

        {/* Platform icon */}
        <div className="w-[18px] h-[18px] rounded animate-pulse bg-[var(--primary-subtle)]" />

        {/* Project name */}
        <div
          className="h-4 rounded-md animate-pulse"
          style={{
            background: 'var(--border)',
            width: `${80 + Math.random() * 100}px`
          }}
        />

        {/* Branch badge */}
        <div className="hidden sm:block h-5 w-16 rounded-md animate-pulse bg-[var(--surface-alt)]" />

        <div className="flex-1" />

        {/* Status badge */}
        <div className="w-6 h-6 rounded-full animate-pulse bg-[var(--border-subtle)]" />

        {/* IDE button */}
        <div className="h-7 w-16 rounded-xl animate-pulse bg-[var(--border-subtle)]" />
      </div>

      {/* Row 2: Metadata & Actions */}
      <div className="flex items-center justify-between gap-3 pl-[88px]">
        {/* URL */}
        <div
          className="h-3 rounded-md animate-pulse"
          style={{
            background: 'var(--border-subtle)',
            width: `${120 + Math.random() * 150}px`
          }}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg animate-pulse bg-[var(--border-subtle)]"
            />
          ))}
        </div>
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
    </div>
  );
}
