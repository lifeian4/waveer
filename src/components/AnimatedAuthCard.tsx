import { ReactNode } from "react";
import { motion } from "framer-motion";

interface AnimatedAuthCardProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  rightTitle?: string;
  rightMessage?: string;
}

export const AnimatedAuthCard = ({
  leftContent,
  rightContent,
  rightTitle = "WELCOME!",
  rightMessage = "Join us today",
}: AnimatedAuthCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-3xl relative z-10"
    >
      <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl border border-primary/20">
        {/* Diagonal Split Background */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 bg-card/90 backdrop-blur-sm"></div>
          <div className="w-1/2 bg-gradient-to-br from-primary/50 to-primary/10"></div>
        </div>

        {/* Diagonal Divider */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/70 to-transparent"
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative h-full flex">
          {/* Left - Form */}
          <div className="w-1/2 p-5 flex flex-col justify-center">
            {leftContent}
          </div>

          {/* Right - Welcome Message */}
          <div className="w-1/2 p-5 flex flex-col justify-center items-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="space-y-3"
            >
              <h2 className="text-2xl font-black text-foreground">
                {rightTitle.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {rightMessage}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
