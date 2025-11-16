import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

interface AgeCounterProps {
  dateOfBirth: string | null;
}

interface TimeUnits {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const AgeCounter = ({ dateOfBirth }: AgeCounterProps) => {
  const [timeUnits, setTimeUnits] = useState<TimeUnits>({
    years: 0,
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!dateOfBirth) return;

    const calculateAge = () => {
      const birthDate = new Date(dateOfBirth);
      const now = new Date();

      // Calculate years
      let years = now.getFullYear() - birthDate.getFullYear();
      let months = now.getMonth() - birthDate.getMonth();
      let days = now.getDate() - birthDate.getDate();

      // Adjust for negative days
      if (days < 0) {
        months--;
        const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonth.getDate();
      }

      // Adjust for negative months
      if (months < 0) {
        years--;
        months += 12;
      }

      // Calculate weeks from remaining days
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;

      // Calculate time components
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      setTimeUnits({
        years,
        months,
        weeks,
        days: remainingDays,
        hours,
        minutes,
        seconds,
      });
    };

    calculateAge();
    const interval = setInterval(calculateAge, 1000);

    return () => clearInterval(interval);
  }, [dateOfBirth]);

  if (!dateOfBirth) return null;

  const TimeUnit = ({ label, value }: { label: string; value: number }) => (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-0.5"
    >
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-sm font-bold text-primary"
      >
        {String(value).padStart(2, "0")}
      </motion.div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-lg border border-primary/20 p-2 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3 h-3 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Your Age</h3>
      </div>

      <div className="grid grid-cols-4 gap-1">
        <TimeUnit label="Years" value={timeUnits.years} />
        <TimeUnit label="Months" value={timeUnits.months} />
        <TimeUnit label="Weeks" value={timeUnits.weeks} />
        <TimeUnit label="Days" value={timeUnits.days} />
      </div>

      <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-primary/10">
        <TimeUnit label="Hours" value={timeUnits.hours} />
        <TimeUnit label="Minutes" value={timeUnits.minutes} />
        <TimeUnit label="Seconds" value={timeUnits.seconds} />
      </div>
    </motion.div>
  );
};

export default AgeCounter;
