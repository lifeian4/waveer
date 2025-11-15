import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Phone, MapPin, Send, MessageCircle, X, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

const Contact = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: ''
  });

  const contactImages = [
    { src: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J', title: 'Support Team', description: '24/7 support ready to help' },
    { src: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J', title: 'Our Office', description: 'Modern workspace in Kigali' },
    { src: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J', title: 'Customer Care', description: 'Personalized assistance' },
    { src: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J', title: 'Tech Support', description: 'Expert technical help' },
    { src: 'https://drive.google.com/uc?export=view&id=1oS22XXxZrzvgavSJ8I17ZJ4j2Qp9XA8J', title: 'Community', description: 'Join our community' }
  ];

  const contactMethods = [
    {
      icon: Mail, title: 'Email', value: 'yvesishimwe20252026@gmail.com',
      action: 'mailto:yvesishimwe20252026@gmail.com', color: 'text-blue-500'
    },
    {
      icon: Phone, title: 'Phone', value: '+250792898287',
      action: 'tel:+250792898287', color: 'text-green-500'
    },
    {
      icon: MessageCircle, title: 'WhatsApp', value: '+250732539470',
      action: 'https://wa.me/250732539470', color: 'text-emerald-500'
    },
    {
      icon: MapPin, title: 'Location', value: 'Kigali, Rwanda',
      action: '#', color: 'text-purple-500'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Message sent successfully!');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-12 h-12 text-primary" />
              <h1 className="text-6xl font-black">
                <span className="text-primary">W</span>aver
              </h1>
            </div>
            <h2 className="text-4xl font-bold mb-6">Get in Touch</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions? Need support? We're here to help!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={method.title} className="text-center cursor-pointer hover:shadow-lg"
                    onClick={() => window.open(method.action, '_blank')}>
                <CardContent className="p-6">
                  <method.icon className={`w-8 h-8 ${method.color} mx-auto mb-4`} />
                  <h4 className="font-bold mb-2">{method.title}</h4>
                  <p className={`text-sm ${method.color}`}>{method.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Form & Gallery */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Name" value={formData.name} 
                       onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <Input type="email" placeholder="Email" value={formData.email}
                       onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <Input placeholder="Subject" value={formData.subject}
                       onChange={(e) => setFormData({...formData, subject: e.target.value})} />
                <Textarea placeholder="Message" rows={4} value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})} />
                <Button type="submit" className="w-full">
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Gallery */}
          <div className="grid grid-cols-2 gap-4">
            {contactImages.map((image, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden cursor-pointer"
                   onClick={() => setSelectedImage(index)}>
                <img src={image.src} alt={image.title} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 text-white">
                    <p className="text-sm font-bold">{image.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-2xl w-full">
              <Button variant="ghost" size="icon" className="absolute -top-12 right-0 text-white"
                      onClick={() => setSelectedImage(null)}>
                <X className="w-6 h-6" />
              </Button>
              <img src={contactImages[selectedImage].src} alt="" className="w-full rounded-lg" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 rounded-b-lg">
                <h3 className="text-white font-bold">{contactImages[selectedImage].title}</h3>
                <p className="text-white/80 text-sm">{contactImages[selectedImage].description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Contact;
