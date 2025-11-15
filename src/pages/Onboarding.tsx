import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, User, Phone, MapPin, Upload, Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { countries } from "@/data/countries";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    phoneNumber: "",
    countryCode: "US",
    countryDialCode: "+1",
    countryName: "United States",
  });

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 3;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 2MB",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !currentUser) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
    const filePath = `${currentUser.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSkipOnboarding = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Mark onboarding as completed without filling data
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast({
        title: "Onboarding skipped",
        description: "You can complete your profile later from settings",
      });

      navigate('/');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to skip onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      let avatarUrl = null;
      
      // Upload avatar if provided
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Update profile in database
      const fullPhoneNumber = formData.phoneNumber 
        ? `${formData.countryDialCode}${formData.phoneNumber}` 
        : '';
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          bio: formData.bio,
          phone_number: fullPhoneNumber,
          country_code: formData.countryCode,
          country_name: formData.countryName,
          avatar_url: avatarUrl,
          onboarding_completed: true,
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast({
        title: "Profile completed!",
        description: "Welcome to Waver!",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const selectedCountry = countries.find(c => c.code === formData.countryCode);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, hsl(188 95% 52% / 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, hsl(280 80% 50% / 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, hsl(188 95% 52% / 0.15) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
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
            }}
          />
        ))}
      </div>

      {/* Onboarding Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
          {/* Logo & Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6 text-primary" />
                </motion.div>
                <h1 className="text-2xl font-black">
                  <span className="text-primary">W</span>
                  <span className="text-foreground">aver</span>
                </h1>
              </div>
              <div className="text-sm text-muted-foreground font-semibold">
                Step {step} of {totalSteps}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Upload Your Photo
                  </h2>
                  <p className="text-muted-foreground">
                    Add a profile picture so others can recognize you
                  </p>
                </div>

                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-primary/20 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-12 h-12 text-muted-foreground" />
                      )}
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Upload className="w-5 h-5 text-primary-foreground" />
                    </motion.button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF • Max 2MB
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Tell Us About Yourself
                  </h2>
                  <p className="text-muted-foreground">
                    Help us personalize your experience
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="fullName" className="text-foreground font-semibold flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="mt-2 h-12 bg-background/50 border-2 focus:border-primary"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-foreground font-semibold">
                      Bio (Optional)
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a bit about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="mt-2 min-h-24 bg-background/50 border-2 focus:border-primary resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Contact Information
                  </h2>
                  <p className="text-muted-foreground">
                    Add your phone number and location
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Country Select */}
                  <div>
                    <Label htmlFor="country" className="text-foreground font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Country
                    </Label>
                    <Select
                      value={formData.countryCode}
                      onValueChange={(value) => {
                        const country = countries.find(c => c.code === value);
                        setFormData({
                          ...formData,
                          countryCode: value,
                          countryDialCode: country?.dialCode || "+1",
                          countryName: country?.name || "",
                        });
                      }}
                    >
                      <SelectTrigger className="mt-2 h-12 bg-background/50 border-2 focus:border-primary">
                        <SelectValue>
                          {selectedCountry && (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{selectedCountry.flag}</span>
                              <span>{selectedCountry.name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{country.flag}</span>
                              <span>{country.name}</span>
                              <span className="text-muted-foreground ml-auto">{country.dialCode}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="phone" className="text-foreground font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      Phone Number (Optional)
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <div className="w-24 h-12 bg-muted/50 border-2 border-border rounded-lg flex items-center justify-center font-semibold">
                        {selectedCountry?.flag} {formData.countryDialCode}
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="123 456 7890"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="flex-1 h-12 bg-background/50 border-2 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={loading}
                className="px-6"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            <Button
              variant="hero"
              onClick={nextStep}
              disabled={loading}
              className="px-8 gap-2 rounded-xl"
            >
              {loading ? (
                "Saving..."
              ) : step === totalSteps ? (
                <>
                  Complete <Check className="w-5 h-5" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>

          {/* Skip Options */}
          <div className="text-center mt-4 space-y-2">
            {step < totalSteps && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={loading}
                className="block w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip this step
              </button>
            )}
            <button
              onClick={handleSkipOnboarding}
              disabled={loading}
              className="block w-full text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Skip onboarding completely
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
