import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Users, 
  Globe, 
  Award, 
  Sparkles, 
  Heart, 
  Code, 
  Zap,
  Star,
  Camera,
  Music,
  Film,
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navigation from '@/components/Navigation';

const About = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Array of images from Google Drive
  const galleryImages = [
    {
      src: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J',
      title: 'Streaming Experience',
      description: 'Unlimited movies, TV shows, and music at your fingertips'
    },
    {
      src: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J', 
      title: 'Premium Content',
      description: 'Latest blockbusters and exclusive content'
    },
    {
      src: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J',
      title: 'Music Library',
      description: 'Millions of songs from your favorite artists'
    },
    {
      src: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J',
      title: 'Social Features',
      description: 'Connect with friends and share your favorites'
    },
    {
      src: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J',
      title: 'Personal Experience',
      description: 'Customized recommendations just for you'
    }
  ];

  const features = [
    {
      icon: Film,
      title: 'Unlimited Streaming',
      description: 'Watch thousands of movies and TV shows in HD quality',
      color: 'text-blue-500'
    },
    {
      icon: Music,
      title: 'Music Library',
      description: 'Access millions of songs and create custom playlists',
      color: 'text-purple-500'
    },
    {
      icon: Users,
      title: 'Social Features',
      description: 'Follow friends, share content, and discover together',
      color: 'text-green-500'
    },
    {
      icon: Headphones,
      title: 'High Quality Audio',
      description: 'Crystal clear sound with lossless audio support',
      color: 'text-orange-500'
    },
    {
      icon: Globe,
      title: 'Global Content',
      description: 'Content from around the world in multiple languages',
      color: 'text-cyan-500'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant streaming with our optimized delivery network',
      color: 'text-yellow-500'
    }
  ];

  const stats = [
    { icon: Users, value: '2M+', label: 'Active Users' },
    { icon: Film, value: '50K+', label: 'Movies & Shows' },
    { icon: Music, value: '10M+', label: 'Songs' },
    { icon: Award, value: '4.9★', label: 'User Rating' }
  ];

  const team = [
    {
      name: 'Ishimwe Yves',
      role: 'Founder & CEO',
      image: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J',
      description: 'Visionary leader passionate about entertainment technology'
    },
    {
      name: 'Development Team',
      role: 'Engineering',
      image: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J', 
      description: 'World-class developers building the future of streaming'
    },
    {
      name: 'Content Team',
      role: 'Content Curation',
      image: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J',
      description: 'Experts in discovering and curating amazing content'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 80%, hsl(188 95% 52% / 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, hsl(280 80% 50% / 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 80%, hsl(188 95% 52% / 0.1) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 pointer-events-none"
        />
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-12 h-12 text-primary" />
              </motion.div>
              <h1 className="text-6xl font-black">
                <span className="text-primary">W</span>
                <span className="text-foreground">aver</span>
              </h1>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Waver</span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We're revolutionizing entertainment by bringing together streaming, social features, 
              and personalized experiences in one beautiful platform.
            </p>
          </motion.div>

          {/* Demo Video Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mb-12"
          >
            <Button
              onClick={() => setShowVideoModal(true)}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Play className="w-6 h-6 mr-2" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold mb-6">Why Choose Waver?</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We've built the ultimate entertainment platform with features that matter most to you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 mb-6`}>
                      <feature.icon className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <h4 className="text-xl font-bold mb-4">{feature.title}</h4>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold mb-6">Experience Waver</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Take a visual journey through our platform and see what makes us special.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative overflow-hidden rounded-xl cursor-pointer group"
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h4 className="text-lg font-bold mb-1">{image.title}</h4>
                    <p className="text-sm opacity-90">{image.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold mb-6">Meet Our Team</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Passionate individuals working together to create the future of entertainment.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -5 }}
              >
                <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover rounded-full border-4 border-primary/20"
                      />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <h4 className="text-xl font-bold mb-2">{member.name}</h4>
                    <p className="text-primary font-semibold mb-3">{member.role}</p>
                    <p className="text-muted-foreground text-sm">{member.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 text-white hover:bg-white/20"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              
              <img
                src={galleryImages[selectedImage].src}
                alt={galleryImages[selectedImage].title}
                className="w-full h-full object-contain rounded-lg"
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {galleryImages[selectedImage].title}
                </h3>
                <p className="text-white/80">
                  {galleryImages[selectedImage].description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl w-full aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 text-white hover:bg-white/20"
                onClick={() => setShowVideoModal(false)}
              >
                <X className="w-6 h-6" />
              </Button>
              
              <iframe
                className="w-full h-full rounded-lg"
                src="https://player.mediadelivery.net/embed/542378/2258e659-0721-4daa-afed-ad5be59e62b2"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                title="Waver Demo Video"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default About;
