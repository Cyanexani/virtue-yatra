import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Lightbulb, Loader2, Sparkles, HelpCircle, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExplainPlanModal } from "./ExplainPlanModal";
import { InteractiveMap } from "./InteractiveMap";
import { Button } from "@/components/ui/button";

interface ItineraryProps {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  travelers?: string;
  budget?: string;
  specialRequests?: string;
}

interface AIItineraryDay {
  day: string;
  destination: string;
  cost: number;
  utility_score: number;
  reasoning: string;
}

interface AIResponse {
  itinerary?: AIItineraryDay[];
  total_utility?: number;
  total_cost?: number;
  logs?: any[];
  error?: string;
}

const ITINERARY_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/plan-trip";

const Itinerary = ({ destination, startDate, endDate, interests, travelers, budget, specialRequests }: ItineraryProps) => {
  const { t } = useLanguage();
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [localItinerary, setLocalItinerary] = useState<AIItineraryDay[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [selectedDayInfo, setSelectedDayInfo] = useState<AIItineraryDay | null>(null);
  const itineraryRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!itineraryRef.current) return;
    try {
      const canvas = await html2canvas(itineraryRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("VirtueYatra_Itinerary.pdf");
    } catch (e) {
      console.error("Failed to generate PDF", e);
    }
  };

  const handleShareWhatsApp = () => {
    if (!aiData?.itinerary) return;
    let text = `🌟 *My VirtueYatra AI Trip Plan* 🌟\n\n`;
    text += `📍 Destination: ${destination}\n`;
    text += `💰 Total Budget: ₹${aiData.total_cost}\n\n`;
    localItinerary.forEach(item => {
        text += `🔹 *${item.day.replace("_", " ")}*: ${item.destination}\n`;
    });
    text += `\n🚀 Plan your own trip at https://virtue-yatra.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(localItinerary);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update the "Day X" labels to stay sequential
    const updatedItems = items.map((item, index) => ({
      ...item,
      day: `Day_${index + 1}`
    }));
    
    setLocalItinerary(updatedItems);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchAI = async () => {
      setAiLoading(true);
      setAiError(null);
      setAiData(null);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      
      const numericBudget = budget === 'premium' ? 30000 : budget === 'luxury' ? 20000 : budget === 'moderate' ? 15000 : 10000;

      try {
        const resp = await fetch(ITINERARY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            destination, 
            budget: numericBudget, 
            days: Math.min(dayCount, 4), 
            interests 
          }),
        });
        if (!resp.ok) throw new Error("AI Agent unavailable. Is the Python backend running?");
        const data = await resp.json();
        if (!cancelled) {
          setAiData(data);
          setLocalItinerary(data.itinerary || []);
        }
      } catch (e) {
        if (!cancelled) setAiError(e instanceof Error ? e.message : "Failed to load AI itinerary");
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };
    if (destination && startDate && endDate) fetchAI();
    return () => { cancelled = true; };
  }, [destination, startDate, endDate, JSON.stringify(interests), travelers, budget, specialRequests]);

  return (
    <Card className="p-6 mt-8 border-border/50 bg-card/80 backdrop-blur-sm animate-slide-up">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-travel-ocean flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold">{t('itinerary.title') || "Agentic AI Trip Plan"}</h3>
        </div>
        {aiLoading && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Agent Decision Engine Running...
          </span>
        )}
        {aiData?.itinerary && !aiLoading && (
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Sparkles className="w-3.5 h-3.5" /> AI Agent Generated
          </span>
        )}
      </div>
      
      {aiError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-4 text-sm">
          {aiError}
        </div>
      )}
      
      {aiData?.error && (
        <div className="p-4 bg-amber-500/10 text-amber-500 rounded-lg mb-4 text-sm font-semibold">
          AI CSP Solver Error: {aiData.error}
        </div>
      )}

      {aiData?.itinerary && (
        <div ref={itineraryRef} className="p-2 bg-background rounded-lg">
          <div className="flex justify-between items-center mb-6 bg-muted/30 p-4 rounded-lg flex-wrap gap-4">
             <div>
               <p className="text-sm text-muted-foreground">Total Budget Used</p>
               <p className="font-bold text-lg">₹{aiData.total_cost}</p>
             </div>
             <div>
               <p className="text-sm text-muted-foreground">Overall Utility Score</p>
               <p className="font-bold text-lg text-primary">{aiData.total_utility}</p>
             </div>
             <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                 <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" data-html2canvas-ignore>
                     <Download className="w-4 h-4" /> PDF
                 </Button>
                 <Button onClick={handleShareWhatsApp} variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none" data-html2canvas-ignore>
                     <Share2 className="w-4 h-4" /> WhatsApp
                 </Button>
             </div>
          </div>
          
          <InteractiveMap itinerary={localItinerary} />
          
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="itinerary-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6 mt-6">
                  {localItinerary.map((dayItem, idx) => (
                    <Draggable key={dayItem.destination + idx} draggableId={dayItem.destination + idx} index={idx}>
                      {(provided) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.draggableProps} 
                          {...provided.dragHandleProps}
                          className="border-l-2 border-primary/30 pl-6 pb-4 relative bg-card p-4 rounded-lg hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-b border-border/50"
                        >
                          <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-primary" />
                          
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                {dayItem.day.replace("_", " ")}
                                </span>
                                <h4 className="font-bold text-xl">{dayItem.destination}</h4>
                            </div>
                            
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-1.5 shadow-sm hover:border-primary/50"
                                onClick={() => setSelectedDayInfo(dayItem)}
                                data-html2canvas-ignore
                            >
                                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                                Explain Plan
                            </Button>
                          </div>
                          
                          <div className="flex gap-6 text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-border/30">
                             <p><strong>Cost Constraint:</strong> ₹{dayItem.cost}</p>
                             <p><strong>Utility Evaluated:</strong> <span className="text-primary font-medium">{dayItem.utility_score}</span></p>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          {selectedDayInfo && (
            <ExplainPlanModal 
              isOpen={!!selectedDayInfo} 
              onClose={() => setSelectedDayInfo(null)}
              destination={selectedDayInfo.destination}
              reasoning={selectedDayInfo.reasoning}
              logs={aiData.logs || []}
            />
          )}
        </div>
      )}

      {/* Travel Tips */}
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-travel-ocean/5 border border-primary/10">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">{t('itinerary.tips') || "Travel Tips"}</h4>
        </div>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            Check the weather prediction probabilities generated by the agent.
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            Utility is maximized based on your preferences.
          </li>
        </ul>
      </div>
    </Card>
  );
};

export default Itinerary;
