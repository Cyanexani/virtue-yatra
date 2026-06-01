import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Cpu } from "lucide-react";

interface ExplainPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  reasoning: string;
  logs: any[];
}

export const ExplainPlanModal = ({ isOpen, onClose, destination, reasoning, logs }: ExplainPlanModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Cpu className="w-5 h-5 text-primary" />
            AI Reasoning: Why {destination}?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/30 p-4 rounded-lg text-sm border border-border/50">
            <h4 className="font-semibold mb-2 text-primary">Decision Engine Summary</h4>
            <p className="text-muted-foreground">{reasoning}</p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Under the Hood (Agent Logs):</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{log.step}:</strong> {log.reasoning}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
