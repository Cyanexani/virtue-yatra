import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import VirtualWorld from "./VirtualWorld";

const Hero = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-travel-ocean/60 via-travel-ocean/40 to-background" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: "2s" }} />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-effect px-6 py-3 rounded-full mb-8 animate-slide-up">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{t('hero.badge')}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            {t('hero.title1')}
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">
              {t('hero.title2')}
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.4s" }}>
            {t('hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <Button
              size="lg"
              onClick={() => {
                const planSection = document.getElementById('plan');
                planSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-secondary to-accent hover:scale-105 transition-all duration-300 shadow-2xl text-white font-semibold px-8 py-6 text-lg group"
            >
              {t('hero.startPlanning')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                const destinationsSection = document.getElementById('destinations');
                destinationsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="glass-effect border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg backdrop-blur-xl"
            >
              {t('hero.exploreDestinations')}
            </Button>
          </div>

          {/* Virtual World Button */}
          <div className="flex justify-center mt-6 animate-slide-up" style={{ animationDelay: "0.8s" }}>
            <VirtualWorld />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-8 max-w-xl mx-auto mt-10 animate-slide-up" style={{ animationDelay: "1s" }}>
            <div className="glass-effect rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
              <MapPin className="w-8 h-8 text-secondary mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">1000+</div>
              <div className="text-sm text-white/80">{t('hero.destinations')}</div>
            </div>
            <div className="glass-effect rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
              <Calendar className="w-8 h-8 text-secondary mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-white/80">{t('hero.support')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
