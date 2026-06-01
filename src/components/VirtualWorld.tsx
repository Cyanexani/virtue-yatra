import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Globe, X, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const VirtualWorld = () => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  const virtualTours = [
    {
      id: 1,
      name: "Taj Mahal, Agra",
      nameHi: "ताज महल, आगरा",
      nameTe: "తాజ్ మహల్, ఆగ్రా",
      thumbnail: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400",
      videoUrl: "https://www.youtube.com/embed/49HTIoCccDY?autoplay=1"
    },
    {
      id: 2,
      name: "Varanasi Ghats",
      nameHi: "वाराणसी घाट",
      nameTe: "వారణాసి ఘాట్లు",
      thumbnail: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400",
      videoUrl: "https://www.youtube.com/embed/gYO1uk7vIcc?autoplay=1"
    },
    {
      id: 3,
      name: "Jaipur City Palace",
      nameHi: "जयपुर सिटी पैलेस",
      nameTe: "జైపూర్ సిటీ ప్యాలెస్",
      thumbnail: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400",
      videoUrl: "https://www.youtube.com/embed/gYO1uk7vIcc?autoplay=1"
    },
    {
      id: 4,
      name: "Kerala Backwaters",
      nameHi: "केरल बैकवाटर्स",
      nameTe: "కేరళ బ్యాక్‌వాటర్స్",
      thumbnail: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400",
      videoUrl: "https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=1"
    },
    {
      id: 5,
      name: "Ladakh Mountains",
      nameHi: "लद्दाख पर्वत",
      nameTe: "లడఖ్ పర్వతాలు",
      thumbnail: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400",
      videoUrl: "https://www.youtube.com/embed/mQhXjD6J9Ik?autoplay=1"
    }
  ];

  const [selectedTour, setSelectedTour] = useState(virtualTours[0]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 gap-2"
        >
          <Globe className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
          {t('virtualWorld.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <Globe className="w-6 h-6 text-purple-600" />
            {t('virtualWorld.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row h-[calc(85vh-80px)]">
          {/* Video Player */}
          <div className="flex-1 bg-black relative">
            {isPlaying ? (
              <iframe
                src={selectedTour.videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; vr"
                allowFullScreen
                title="360° Virtual Tour"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                <img
                  src={selectedTour.thumbnail}
                  alt={selectedTour.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="relative z-10 text-center">
                  <Button
                    onClick={() => setIsPlaying(true)}
                    size="lg"
                    className="rounded-full w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/50 mb-4"
                  >
                    <Play className="w-10 h-10 text-white fill-white" />
                  </Button>
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedTour.name}</h3>
                  <p className="text-white/80">{t('virtualWorld.clickToExplore')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tour Selection Sidebar */}
          <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-border p-4 overflow-y-auto bg-background">
            <h4 className="font-semibold mb-4 text-foreground">{t('virtualWorld.selectDestination')}</h4>
            <div className="space-y-3">
              {virtualTours.map((tour) => (
                <button
                  key={tour.id}
                  onClick={() => {
                    setSelectedTour(tour);
                    setIsPlaying(false);
                  }}
                  className={`w-full rounded-lg overflow-hidden transition-all duration-300 ${
                    selectedTour.id === tour.id
                      ? 'ring-2 ring-purple-600 scale-105'
                      : 'hover:scale-102 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={tour.thumbnail}
                      alt={tour.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-medium text-left">{tour.name}</p>
                    </div>
                    {selectedTour.id === tour.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                {t('virtualWorld.tip')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualWorld;
