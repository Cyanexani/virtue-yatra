import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, DollarSign, Sparkles, Check, ArrowLeft, History, Trash2, Wand2, Loader2, BrainCircuit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { isGeminiConfigured, parseUserPrompt } from "@/services/gemini";
import Itinerary from "@/components/Itinerary";

interface TripSummary {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  budget: string;
  interests: string[];
  specialRequests: string;
}

interface SavedTrip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: string;
  interests: string[];
  special_requests: string | null;
  created_at: string;
}

const TripPlanner = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showSummary, setShowSummary] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    travelers: "1",
    budget: "",
    interests: [] as string[],
    specialRequests: "",
  });

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleMagicAutofill = async () => {
    if (!chatInput) return;
    setChatLoading(true);
    
    let parsedData;
    
    // Try True AI Parsing first if configured
    if (isGeminiConfigured()) {
      try {
        parsedData = await parseUserPrompt(chatInput);
        console.log("Gemini Parsed Output:", parsedData);
      } catch (geminiError) {
        console.error("Gemini AI failed, falling back to NLP", geminiError);
        parsedData = null;
      }
    }
    
    // Fallback to local NLP parsing
    if (!parsedData) {
      console.log("Using local NLP parsing");
      const msg = chatInput.toLowerCase();
      
      // 1. Flexible Budget Parsing
      let budget = "moderate";
      if (msg.match(/luxury|expensive|high-end|lavish/i)) budget = "luxury";
      else if (msg.match(/premium|first class/i)) budget = "premium";
      else if (msg.match(/cheap|budget|affordable|low cost|backpacker/i)) budget = "budget";
      
      // 2. Flexible Days Parsing
      let days = 3;
      const daysMatch = msg.match(/(\d+)\s*(?:day|week|month)/i);
      if (daysMatch) {
        if (msg.includes("week")) days = parseInt(daysMatch[1]) * 7;
        else if (msg.includes("month")) days = parseInt(daysMatch[1]) * 30;
        else days = parseInt(daysMatch[1]);
      }
      
      // 3. Smart Destination Extraction (Regex Context + Fallbacks)
      let dest = "South India";
      const destMatch = chatInput.match(/(?:trip to|visit|travel to|go to|explore|tour of|in)\s+([a-zA-Z\s]+?)(?=\s+for|\s+with|\s+and|\s+to|\.|,|$)/i);
      if (destMatch && destMatch[1].trim().length > 2) {
        dest = destMatch[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      } else {
        const common = ["kerala", "ooty", "goa", "delhi", "mumbai", "bangalore", "chennai", "jaipur", "agra", "bali", "paris", "london", "dubai", "singapore", "manali", "shimla"];
        for (const city of common) {
          if (msg.includes(city)) {
            dest = city.charAt(0).toUpperCase() + city.slice(1);
            if (dest === "Delhi") dest = "New Delhi";
            break;
          }
        }
      }
      
      // 4. Flexible Interest Synonyms Mapping
      const foundInterests: string[] = [];
      const interestMap: Record<string, string[]> = {
        "Adventure": ["adventure", "trek", "hike", "sports", "thrill", "mountain", "extreme"],
        "Beach": ["beach", "sea", "ocean", "coast", "surf", "party", "sand"],
        "Culture": ["culture", "temple", "tradition", "heritage", "art", "museum", "local"],
        "Wildlife": ["wildlife", "animal", "safari", "nature", "forest", "zoo", "jungle", "birds"],
        "Photography": ["photo", "camera", "scenic", "view", "nature", "landscape", "picturesque"],
        "Food": ["food", "eat", "culinary", "restaurant", "taste", "dining", "cuisine", "street food"],
        "Hiking": ["hike", "trek", "walk", "mountain", "trail"],
        "Relaxation": ["relax", "spa", "chill", "peace", "calm", "resort", "luxury", "massage", "quiet"],
        "Shopping": ["shop", "buy", "market", "mall", "souvenir", "clothes"],
        "History": ["history", "monument", "fort", "palace", "ruin", "ancient", "architecture"]
      };

      Object.entries(interestMap).forEach(([uiTag, keywords]) => {
        if (keywords.some(kw => msg.includes(kw))) {
          foundInterests.push(uiTag);
        }
      });
      
      parsedData = {
        destination: dest,
        budget,
        days: Math.min(days, 30),
        interests: Array.from(new Set(foundInterests))
      };
    }
    
    applyAutofillData(parsedData);
    setChatLoading(false);
  };

  const applyAutofillData = async (data: any) => {
    const start = new Date();
    const end = new Date();
    const tripDays = data.days || 3;
    // Subtract 1 so a 3-day trip starting on the 13th ends on the 15th (13, 14, 15 = 3 days)
    end.setDate(start.getDate() + Math.max(0, tripDays - 1));
    
    const newFormData = {
      ...formData,
      destination: data.destination || formData.destination,
      budget: data.budget || formData.budget,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      interests: data.interests && data.interests.length > 0 ? data.interests : formData.interests,
    };

    setFormData(newFormData);
    toast({ title: "Magic Autofill Complete! 🪄", description: "We extracted your trip details." });
    
    // Auto-trigger itinerary generation
    setTripSummary(newFormData);
    setShowSummary(true);
    setShowItinerary(true);
    
    // Save to database if user is logged in
    if (user && newFormData.destination) {
      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        destination: newFormData.destination,
        start_date: newFormData.startDate,
        end_date: newFormData.endDate,
        travelers: parseInt(newFormData.travelers),
        budget: newFormData.budget || 'budget',
        interests: newFormData.interests,
        special_requests: newFormData.specialRequests || null,
      });
      if (!error) fetchSavedTrips();
    }
  };

  const interestOptions = [
    "Adventure", "Beach", "Culture", "Wildlife", "Photography",
    "Food", "Hiking", "Relaxation", "Shopping", "History"
  ];

  const budgetLabels: Record<string, string> = {
    budget: t('planner.budgetLow'),
    moderate: t('planner.budgetModerate'),
    luxury: t('planner.budgetLuxury'),
    premium: t('planner.budgetPremium'),
  };

  useEffect(() => {
    if (user) {
      fetchSavedTrips();
    }
  }, [user]);

  const fetchSavedTrips = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trips:', error);
    } else {
      setSavedTrips(data || []);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      toast({
        title: t('toast.missingInfo'),
        description: t('toast.fillDestinationDates'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Save to database if user is logged in
    if (user) {
      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        travelers: parseInt(formData.travelers),
        budget: formData.budget || 'budget',
        interests: formData.interests,
        special_requests: formData.specialRequests || null,
      });

      if (error) {
        toast({
          title: t('toast.errorSavingTrip'),
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      fetchSavedTrips();
    }

    setTripSummary(formData);
    setShowSummary(true);
    setShowItinerary(true);
    setLoading(false);

    toast({
      title: t('toast.tripCreated'),
      description: user 
        ? t('toast.tripSaved').replace('{destination}', formData.destination)
        : t('toast.tripReadySignIn').replace('{destination}', formData.destination),
    });
  };

  const handleDeleteTrip = async (tripId: string) => {
    const { error } = await supabase.from('trips').delete().eq('id', tripId);
    
    if (error) {
      toast({
        title: t('toast.errorSavingTrip'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('toast.tripDeleted'),
        description: t('toast.tripDeletedDesc'),
      });
      fetchSavedTrips();
    }
  };

  const handleNewTrip = () => {
    setShowSummary(false);
    setShowItinerary(false);
    setTripSummary(null);
    setFormData({
      destination: "",
      startDate: "",
      endDate: "",
      travelers: "1",
      budget: "",
      interests: [],
      specialRequests: "",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getInterestLabel = (interest: string) => {
    const key = `interest.${interest.toLowerCase()}`;
    return t(key) || interest;
  };

  return (
    <section id="plan" className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 glass-effect px-6 py-3 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{t('planner.badge')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t('planner.title')} <span className="gradient-text">{t('planner.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('planner.subtitle')}
          </p>
          
          {user && savedTrips.length > 0 && (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              {showHistory ? t('planner.hideHistory') : t('planner.viewHistory')} {t('planner.bookingHistory')} ({savedTrips.length})
            </Button>
          )}
        </div>

        {/* Booking History */}
        {showHistory && user && savedTrips.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12 animate-slide-up">
            <h3 className="text-2xl font-bold mb-6">{t('planner.yourBookingHistory')}</h3>
            <div className="grid gap-4">
              {savedTrips.map((trip) => (
                <Card key={trip.id} className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <h4 className="text-lg font-semibold">{trip.destination}</h4>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatShortDate(trip.start_date)} - {formatShortDate(trip.end_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {trip.travelers} {trip.travelers === 1 ? t('planner.traveler') : t('planner.travelersPlural')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {budgetLabels[trip.budget] || trip.budget}
                        </span>
                      </div>
                      {trip.interests && trip.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {trip.interests.map((interest) => (
                            <span key={interest} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                              {getInterestLabel(interest)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteTrip(trip.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {showSummary && tripSummary ? (
            /* Trip Summary Card */
            <>
              <Card className="p-8 border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm animate-slide-up">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-travel-ocean rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold gradient-text mb-2">{t('planner.tripPlanned')}</h3>      <p className="text-muted-foreground">
                    {user ? t('planner.savedToHistory') : t('planner.signInToSave')}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('planner.destination')}</p>
                        <p className="font-semibold text-lg">{tripSummary.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('planner.travelDates')}</p>
                        <p className="font-semibold">{formatDate(tripSummary.startDate)}</p>
                        <p className="text-sm text-muted-foreground">{t('planner.to')}</p>
                        <p className="font-semibold">{formatDate(tripSummary.endDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                      <Users className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('planner.travelers')}</p>
                        <p className="font-semibold text-lg">
                          {tripSummary.travelers} {parseInt(tripSummary.travelers) === 1 ? t('planner.person') : t('planner.people')}
                        </p>
                      </div>
                    </div>

                    {tripSummary.budget && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                        <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">{t('planner.budget')}</p>
                          <p className="font-semibold">{budgetLabels[tripSummary.budget]}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {tripSummary.interests.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-3">{t('planner.selectedInterests') || "Curated Preferences"}</p>
                    <div className="space-y-4">
                      {/* Vibe Category */}
                      {tripSummary.interests.some(i => ["Relaxation", "Luxury", "Party"].includes(i)) && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">✨ Vibe & Atmosphere</p>
                          <div className="flex flex-wrap gap-2">
                            {tripSummary.interests.filter(i => ["Relaxation", "Luxury", "Party"].includes(i)).map(interest => (
                              <span key={interest} className="px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium text-sm border border-purple-500/20 shadow-sm">
                                {getInterestLabel(interest)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Activity Category */}
                      {tripSummary.interests.some(i => ["Adventure", "Hiking", "Wildlife"].includes(i)) && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">🏃‍♂️ Activities</p>
                          <div className="flex flex-wrap gap-2">
                            {tripSummary.interests.filter(i => ["Adventure", "Hiking", "Wildlife"].includes(i)).map(interest => (
                              <span key={interest} className="px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium text-sm border border-orange-500/20 shadow-sm">
                                {getInterestLabel(interest)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience Category */}
                      {tripSummary.interests.some(i => ["Culture", "History", "Food", "Shopping", "Photography", "Beach"].includes(i)) && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">🎭 Experiences & Scenery</p>
                          <div className="flex flex-wrap gap-2">
                            {tripSummary.interests.filter(i => ["Culture", "History", "Food", "Shopping", "Photography", "Beach"].includes(i)).map(interest => (
                              <span key={interest} className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-sm border border-blue-500/20 shadow-sm">
                                {getInterestLabel(interest)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tripSummary.specialRequests && (
                  <div className="mb-8 p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">{t('planner.specialRequests')}</p>
                    <p className="text-foreground">{tripSummary.specialRequests}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleNewTrip}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('planner.planAnotherTrip')}
                  </Button>
                  <Button
                    onClick={() => setShowItinerary(!showItinerary)}
                    className="flex-1 bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-all duration-300"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('planner.getDetailedItinerary')}
                  </Button>
                </div>
              </Card>

              {/* Detailed Itinerary */}
              {showItinerary && (
                <Itinerary
                  destination={tripSummary.destination}
                  startDate={tripSummary.startDate}
                  endDate={tripSummary.endDate}
                  interests={tripSummary.interests}
                  travelers={tripSummary.travelers}
                  budget={tripSummary.budget}
                  specialRequests={tripSummary.specialRequests}
                />
              )}
            </>
          ) : (
            /* Main Input Area */
            <Card className="p-8 border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-travel-ocean/5 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto space-y-6 py-6">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-travel-ocean flex items-center justify-center shadow-lg">
                    <BrainCircuit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold">{t('planner.askAI') || "Ask the AI Planner"}</h3>
                    <p className="text-sm font-semibold text-primary/80">
                      {isGeminiConfigured() ? "Powered by Google Gemini 2.5 AI" : "Powered by VirtueYatra NLP Engine"}
                    </p>
                  </div>
                </div>
                
                <p className="text-center text-muted-foreground text-lg">
                  Tell me about your dream vacation. I'll handle the logistics.
                </p>

                <div className="w-full relative shadow-lg rounded-2xl group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                  <Textarea 
                    placeholder='e.g. "I want a 4 day luxury trip to Kerala for adventure and wildlife photography"' 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleMagicAutofill();
                      }
                    }}
                    className="w-full min-h-[140px] p-6 text-lg bg-background border-primary/20 rounded-2xl resize-none focus:ring-0"
                  />
                  <div className="absolute bottom-4 right-4">
                    <Button 
                      onClick={handleMagicAutofill} 
                      disabled={chatLoading || !chatInput.trim()} 
                      className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md h-12 px-6"
                    >
                      {chatLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Plan Trip
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 w-full text-center">
                  <button 
                    type="button"
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                  >
                    {showManualForm ? "Hide manual entry form" : "Prefer manual entry? Click here"}
                  </button>
                </div>
              </div>

              {/* Collapsible Manual Form */}
              {showManualForm && (
                <div className="mt-8 pt-8 border-t border-border/50 relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
                  <form onSubmit={handleSubmit} className="space-y-6">
                {/* Destination and Dates */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="destination" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {t('planner.destination')}
                    </Label>
                    <Input
                      id="destination"
                      placeholder={t('planner.whereTo')}
                      value={formData.destination}
                      onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {t('planner.startDate')}
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {t('planner.endDate')}
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Travelers and Budget */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="travelers" className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      {t('planner.travelers')}
                    </Label>
                    <Select value={formData.travelers} onValueChange={(value) => setFormData(prev => ({ ...prev, travelers: value }))}>
                      <SelectTrigger className="border-border/50 focus:border-primary bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? t('planner.traveler') : t('planner.travelersPlural')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      {t('planner.budget')}
                    </Label>
                    <Select value={formData.budget} onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                      <SelectTrigger className="border-border/50 focus:border-primary bg-background">
                        <SelectValue placeholder={t('planner.selectBudget')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        <SelectItem value="budget">{t('planner.budgetLow')}</SelectItem>
                        <SelectItem value="moderate">{t('planner.budgetModerate')}</SelectItem>
                        <SelectItem value="luxury">{t('planner.budgetLuxury')}</SelectItem>
                        <SelectItem value="premium">{t('planner.budgetPremium')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-3">
                  <Label>{t('planner.interests')}</Label>
                  <p className="text-sm text-muted-foreground">{t('planner.selectInterests')}</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {interestOptions.map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          formData.interests.includes(interest)
                            ? 'bg-primary text-primary-foreground shadow-md scale-105'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:scale-105'
                        }`}
                      >
                        {getInterestLabel(interest)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Requests */}
                <div className="space-y-2">
                  <Label htmlFor="specialRequests">{t('planner.specialRequests')}</Label>
                  <Textarea
                    id="specialRequests"
                    placeholder={t('planner.specialRequestsPlaceholder')}
                    value={formData.specialRequests}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    className="border-border/50 focus:border-primary min-h-24"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-all duration-300 shadow-lg text-lg py-6"
                >
                  <Sparkles className="mr-2 w-5 h-5" />
                  {loading ? t('planner.creating') : t('planner.createItinerary')}
                </Button>

                  {!user && (
                    <p className="text-center text-sm text-muted-foreground">
                      {t('planner.signInToSave')}
                    </p>
                  )}
                </form>
              </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default TripPlanner;
