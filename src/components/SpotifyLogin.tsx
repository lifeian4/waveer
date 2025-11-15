import React from 'react';
import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const SpotifyLogin: React.FC = () => {
  const handleLogin = () => {
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-md"
      >
        {/* Logo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="mb-8 flex justify-center"
        >
          <div className="bg-green-500 rounded-full p-6">
            <Music className="w-16 h-16 text-black" />
          </div>
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-4">Waver</h1>
        <p className="text-xl text-gray-300 mb-2">Music Player</p>
        <p className="text-gray-400 mb-12">
          Experience music like never before with Spotify integration
        </p>

        {/* Features */}
        <div className="mb-12 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Full playback control</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Shuffle & repeat modes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Volume control</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Beautiful UI</span>
          </div>
        </div>

        {/* Login Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleLogin}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 text-lg rounded-full"
          >
            Login with Spotify
          </Button>
        </motion.div>

        {/* Note */}
        <p className="text-gray-500 text-sm mt-8">
          Requires Spotify Premium account
        </p>
      </motion.div>
    </div>
  );
};

export default SpotifyLogin;
