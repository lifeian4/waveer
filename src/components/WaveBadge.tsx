import { Crown, Waves, Zap, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";

interface WaveBadgeProps {
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const badgeConfig = {
  rising_wave: {
    name: 'Rising Wave',
    icon: Waves,
    gradient: 'from-gray-400 to-gray-600',
    glow: 'shadow-gray-400/50',
    description: 'Silver ripple badge with soft blue glow'
  },
  flow_creator: {
    name: 'Flow Creator', 
    icon: Sparkles,
    gradient: 'from-blue-400 to-cyan-600',
    glow: 'shadow-blue-400/50',
    description: 'Aqua-blue crystal wave with white highlights'
  },
  trending_wave: {
    name: 'Trending Wave',
    icon: Zap,
    gradient: 'from-yellow-400 to-orange-600',
    glow: 'shadow-yellow-400/50',
    description: 'Gold gradient with motion blur wave'
  },
  elite_wave: {
    name: 'Elite Wave',
    icon: Star,
    gradient: 'from-purple-400 to-indigo-600',
    glow: 'shadow-purple-400/50',
    description: 'Deep violet with starlight reflections'
  },
  wave_king: {
    name: 'Wave King/Queen',
    icon: Crown,
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    glow: 'shadow-amber-400/50',
    description: 'Platinum + Diamond fusion with pulsating aura'
  }
};

const sizeConfig = {
  sm: {
    container: 'w-6 h-6',
    icon: 'w-3 h-3',
    text: 'text-xs'
  },
  md: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4', 
    text: 'text-sm'
  },
  lg: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    text: 'text-base'
  }
};

const WaveBadge: React.FC<WaveBadgeProps> = ({ 
  tier, 
  size = 'md', 
  animated = true,
  className = '' 
}) => {
  const config = badgeConfig[tier as keyof typeof badgeConfig];
  const sizeStyles = sizeConfig[size];
  
  if (!config) return null;
  
  const Icon = config.icon;
  
  const badgeElement = (
    <div 
      className={`
        relative ${sizeStyles.container} rounded-full 
        bg-gradient-to-br ${config.gradient}
        shadow-lg ${config.glow}
        flex items-center justify-center
        border-2 border-white/20
        ${className}
      `}
      title={`${config.name} - ${config.description}`}
    >
      {/* Animated background shimmer */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      
      {/* Pulsating glow for Wave King */}
      {animated && tier === 'wave_king' && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      
      {/* Icon */}
      <Icon className={`${sizeStyles.icon} text-white relative z-10`} />
      
      {/* Sparkle effect for higher tiers */}
      {animated && (tier === 'elite_wave' || tier === 'wave_king') && (
        <>
          <motion.div
            className="absolute -top-1 -right-1 w-1 h-1 bg-white rounded-full"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0,
            }}
          />
          <motion.div
            className="absolute -bottom-1 -left-1 w-1 h-1 bg-white rounded-full"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.5,
            }}
          />
        </>
      )}
    </div>
  );
  
  return animated ? (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="inline-block"
    >
      {badgeElement}
    </motion.div>
  ) : (
    badgeElement
  );
};

export default WaveBadge;
