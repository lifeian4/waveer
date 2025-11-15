import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const Preloader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      {/* Animated Background */}
      <motion.div
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, hsl(188 95% 52% / 0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, hsl(280 80% 50% / 0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 20%, hsl(340 90% 55% / 0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, hsl(188 95% 52% / 0.2) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 1, 0],
              scale: [0, 2, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main Loader */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated Logo */}
        <motion.div
          className="relative"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 w-32 h-32 rounded-full border-4 border-primary/20"
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          {/* Middle Ring */}
          <motion.div
            className="absolute inset-2 w-28 h-28 rounded-full border-4 border-accent/30"
            animate={{
              rotate: -360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
            }}
          />

          {/* Inner Circle with Logo */}
          <motion.div
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl flex items-center justify-center border border-border shadow-2xl"
            animate={{
              boxShadow: [
                "0 0 20px rgba(239, 68, 68, 0.3)",
                "0 0 40px rgba(239, 68, 68, 0.6)",
                "0 0 20px rgba(239, 68, 68, 0.3)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Sparkles className="w-12 h-12 text-primary" />
            </motion.div>
          </motion.div>

          {/* Orbiting Dots */}
          {[0, 120, 240].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-primary rounded-full"
              style={{
                top: "50%",
                left: "50%",
              }}
              animate={{
                rotate: angle,
                x: [0, 60, 0],
                y: [0, 0, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>

        {/* Logo Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <motion.h1
            className="text-4xl font-black mb-2"
            animate={{
              backgroundPosition: ["0%", "100%", "0%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundImage: "linear-gradient(90deg, hsl(0 84% 60%), hsl(188 95% 52%), hsl(0 84% 60%))",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            <span>W</span>
            <span>aver</span>
          </motion.h1>
          
          {/* Loading Text */}
          <motion.p
            className="text-muted-foreground text-sm font-medium"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Loading your experience...
          </motion.p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="w-64 h-1 bg-muted rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: "50%",
            }}
          />
        </motion.div>

        {/* Animated Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Preloader;
