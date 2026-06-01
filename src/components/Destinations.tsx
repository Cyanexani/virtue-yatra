import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Destinations = () => {
  const [activeTab, setActiveTab] = useState("All");
  const { t } = useLanguage();

  const tabs = [
    { key: "All", label: t('destinations.all') },
    { key: "Adventure", label: t('tag.adventure') },
    { key: "Beach", label: t('tag.beach') },
    { key: "Culture", label: t('tag.culture') },
    { key: "Wildlife", label: t('tag.wildlife') },
    { key: "Nature", label: t('tag.nature') },
  ];

  const destinations = [
    {
      nameKey: "dest.himalayanTrails",
      locationKey: "dest.himalayanTrails.location",
      descKey: "dest.himalayanTrails.desc",
      rating: 4.9,
      reviews: 2847,
      price: "₹25,999",
      tags: ["tag.adventure", "tag.nature", "tag.trekking"],
      category: "Adventure",
      trending: true,
    },
    {
      nameKey: "dest.coastalParadise",
      locationKey: "dest.coastalParadise.location",
      descKey: "dest.coastalParadise.desc",
      rating: 4.8,
      reviews: 1923,
      price: "₹18,499",
      tags: ["tag.beach", "tag.relaxation", "tag.waterSports"],
      category: "Beach",
      trending: false,
    },
    {
      nameKey: "dest.heritageWonders",
      locationKey: "dest.heritageWonders.location",
      descKey: "dest.heritageWonders.desc",
      rating: 4.7,
      reviews: 3156,
      price: "₹22,999",
      tags: ["tag.culture", "tag.history", "tag.architecture"],
      category: "Culture",
      trending: true,
    },
    {
      nameKey: "dest.wildlifeSafari",
      locationKey: "dest.wildlifeSafari.location",
      descKey: "dest.wildlifeSafari.desc",
      rating: 4.9,
      reviews: 1654,
      price: "₹32,999",
      tags: ["tag.wildlife", "tag.photography", "tag.safari"],
      category: "Wildlife",
      trending: false,
    },
    {
      nameKey: "dest.teaGardens",
      locationKey: "dest.teaGardens.location",
      descKey: "dest.teaGardens.desc",
      rating: 4.6,
      reviews: 987,
      price: "₹16,999",
      tags: ["tag.nature", "tag.peaceful", "tag.scenic"],
      category: "Nature",
      trending: false,
    },
    {
      nameKey: "dest.desertAdventure",
      locationKey: "dest.desertAdventure.location",
      descKey: "dest.desertAdventure.desc",
      rating: 4.8,
      reviews: 1432,
      price: "₹21,499",
      tags: ["tag.adventure", "tag.culture", "tag.unique"],
      category: "Adventure",
      trending: true,
    },
    {
      nameKey: "dest.goaBeaches",
      locationKey: "dest.goaBeaches.location",
      descKey: "dest.goaBeaches.desc",
      rating: 4.7,
      reviews: 4521,
      price: "₹15,999",
      tags: ["tag.beach", "tag.nightlife", "tag.food"],
      category: "Beach",
      trending: true,
    },
    {
      nameKey: "dest.varanasiGhats",
      locationKey: "dest.varanasiGhats.location",
      descKey: "dest.varanasiGhats.desc",
      rating: 4.8,
      reviews: 2134,
      price: "₹12,999",
      tags: ["tag.culture", "tag.spiritual", "tag.heritage"],
      category: "Culture",
      trending: false,
    },
    {
      nameKey: "dest.kazirangaSafari",
      locationKey: "dest.kazirangaSafari.location",
      descKey: "dest.kazirangaSafari.desc",
      rating: 4.9,
      reviews: 876,
      price: "₹28,999",
      tags: ["tag.wildlife", "tag.nature", "tag.safari"],
      category: "Wildlife",
      trending: false,
    },
  ];

  const filteredDestinations = activeTab === "All" 
    ? destinations 
    : destinations.filter(d => d.category === activeTab);

  return (
    <section id="destinations" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t('destinations.title')} <span className="gradient-text">{t('destinations.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('destinations.subtitle')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-6 transition-all duration-300 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-primary to-travel-ocean text-white shadow-lg scale-105"
                  : "border-border hover:border-primary hover:bg-primary/5"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Destinations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((destination, index) => (
            <Card
              key={destination.nameKey}
              className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl bg-card cursor-pointer animate-slide-up"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Image Placeholder with Gradient */}
              <div className="relative h-56 bg-gradient-to-br from-primary via-travel-teal to-travel-ocean overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-20 h-20 text-white/30 group-hover:scale-125 transition-transform duration-500" />
                </div>
                
                {/* Trending Badge */}
                {destination.trending && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-secondary text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    {t('destinations.trending')}
                  </div>
                )}

                {/* Overlay Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  {t(destination.locationKey)}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {t(destination.nameKey)}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {t(destination.descKey)}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {destination.tags.map((tagKey) => (
                    <Badge
                      key={tagKey}
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {t(tagKey)}
                    </Badge>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      const planSection = document.getElementById('plan');
                      planSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-transform"
                  >
                    {t('destinations.bookNow')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results Message */}
        {filteredDestinations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">{t('destinations.noResults')}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Destinations;
