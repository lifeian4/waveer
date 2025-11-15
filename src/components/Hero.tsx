import { Play, Info, Sparkles, Zap, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Enhanced Liquid Gradient Overlay */}
      <motion.div
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, hsl(188 95% 52% / 0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, hsl(280 80% 50% / 0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 20%, hsl(340 90% 55% / 0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, hsl(188 95% 52% / 0.2) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
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

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* Title with Enhanced Animation */}
          <motion.h1
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-6xl md:text-8xl font-black mb-6 leading-tight"
          >
            <motion.span
              className="inline-block"
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(239, 68, 68, 0.5)",
                  "0 0 40px rgba(239, 68, 68, 0.8)",
                  "0 0 20px rgba(239, 68, 68, 0.5)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Unleash Your
            </motion.span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient">
              Coding Potential
            </span>
          </motion.h1>

          {/* Enhanced Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-wrap items-center gap-3 mb-8"
          >
            <motion.span 
              whileHover={{ scale: 1.05, y: -2 }}
              className="px-5 py-2.5 bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 rounded-full text-sm font-bold flex items-center gap-2 backdrop-blur-sm"
            >
              <Award className="w-4 h-4" />
              95% Success Rate
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05, y: -2 }}
              className="px-5 py-2.5 bg-foreground/10 backdrop-blur-sm border border-border rounded-full text-sm font-bold flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-accent" />
              50K+ Students
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05, y: -2 }}
              className="px-4 py-2 border border-primary/50 rounded-full text-sm font-semibold flex items-center gap-2 bg-primary/5"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              HD Quality
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05, y: -2 }}
              className="px-4 py-2 border border-accent/50 rounded-full text-sm font-semibold flex items-center gap-2 bg-accent/5"
            >
              <Zap className="w-4 h-4 text-accent" />
              Live Classes
            </motion.span>
          </motion.div>

          {/* Enhanced Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-xl md:text-2xl text-foreground/80 mb-10 max-w-3xl leading-relaxed font-medium"
          >
            Transform your career with{" "}
            <span className="text-primary font-bold">expert-led courses</span>,
            hands-on projects, and a supportive community. Start your journey from
            beginner to professional developer today.
          </motion.p>

          {/* Redesigned Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="flex flex-wrap items-center gap-4 mb-12"
          >
            {/* Start Learning Button */}
            <motion.div
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="hero" 
                size="lg" 
                className="gap-3 rounded-2xl px-8 py-7 text-lg font-bold relative overflow-hidden group shadow-2xl shadow-primary/50"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <Play className="w-6 h-6 fill-current relative z-10 group-hover:scale-110 transition-transform" />
                <span className="relative z-10">Start Learning</span>
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              </Button>
            </motion.div>

            {/* More Info Button */}
            <motion.div
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="secondary" 
                size="lg" 
                className="gap-3 rounded-2xl px-8 py-7 text-lg font-bold relative overflow-hidden group bg-foreground/10 hover:bg-foreground/20 border-2 border-foreground/20 hover:border-primary/50"
              >
                <Info className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform" />
                <span className="relative z-10">More Info</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Section (Replacing old action buttons) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex flex-wrap items-center gap-8"
          >
            {[
              { value: "500+", label: "Courses", delay: 0 },
              { value: "50K+", label: "Students", delay: 0.1 },
              { value: "95%", label: "Success Rate", delay: 0.2 },
              { value: "4.9★", label: "Rating", delay: 0.3 },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 + stat.delay }}
                whileHover={{ y: -5, scale: 1.05 }}
                className="text-center group cursor-default"
              >
                <motion.div 
                  className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-1"
                  animate={{
                    backgroundPosition: ["0%", "100%", "0%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    backgroundSize: "200% auto",
                  }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-foreground/60 font-semibold group-hover:text-foreground/80 transition-colors">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
