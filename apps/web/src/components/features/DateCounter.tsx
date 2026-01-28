import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { differenceInDays, differenceInMonths, differenceInYears, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { MILESTONES } from '@pureliefde/shared';

interface DateCounterProps {
  anniversaryDate: Date;
  className?: string;
}

export function DateCounter({ anniversaryDate, className }: DateCounterProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const days = differenceInDays(now, anniversaryDate);
    const months = differenceInMonths(now, anniversaryDate);
    const years = differenceInYears(now, anniversaryDate);

    // Find next milestone
    let nextMilestone: { type: string; value: number; daysUntil: number } | null = null;

    // Check day milestones
    for (const milestone of MILESTONES.days) {
      if (days < milestone) {
        nextMilestone = {
          type: 'days',
          value: milestone,
          daysUntil: milestone - days,
        };
        break;
      }
    }

    return { days, months, years, nextMilestone };
  }, [anniversaryDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="text-center mb-4">
          <p className="text-white/80 text-sm">Samen sinds</p>
          <p className="text-xl font-semibold">
            {format(anniversaryDate, 'd MMMM yyyy', { locale: nl })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <motion.p
              key={stats.years}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold"
            >
              {stats.years}
            </motion.p>
            <p className="text-white/80 text-sm">jaar</p>
          </div>
          <div>
            <motion.p
              key={stats.months}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold"
            >
              {stats.months % 12}
            </motion.p>
            <p className="text-white/80 text-sm">maanden</p>
          </div>
          <div>
            <motion.p
              key={stats.days}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold"
            >
              {stats.days}
            </motion.p>
            <p className="text-white/80 text-sm">dagen</p>
          </div>
        </div>

        {/* Next milestone */}
        {stats.nextMilestone && (
          <div className="mt-4 pt-4 border-t border-white/20 text-center">
            <p className="text-white/80 text-sm">
              Nog{' '}
              <span className="font-semibold text-white">
                {stats.nextMilestone.daysUntil} dagen
              </span>{' '}
              tot {stats.nextMilestone.value} dagen samen!
            </p>
          </div>
        )}

        {/* Floating hearts decoration */}
        <div className="absolute top-2 right-2 text-2xl animate-pulse-heart">
          💕
        </div>
      </div>
    </motion.div>
  );
}
