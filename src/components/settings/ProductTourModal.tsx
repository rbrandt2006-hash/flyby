import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Plane, 
  Calendar, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";

interface ProductTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tourSteps = [
  {
    icon: Sparkles,
    title: "Welcome to FlyBy",
    description: "Your AI-powered corporate travel command center. Let's take a quick tour of the key features that will transform how you manage business travel.",
    tip: "FlyBy uses AI to automatically plan trips based on your calendar and preferences.",
  },
  {
    icon: Plane,
    title: "Plan Trips Effortlessly",
    description: "Create complete travel itineraries with flights, hotels, and ground transport in seconds. Our AI considers your preferences, company policies, and budget.",
    tip: "Click 'Plan Trip' on any calendar event to get started.",
  },
  {
    icon: Calendar,
    title: "Smart Calendar Integration",
    description: "FlyBy syncs with your calendar to detect upcoming travel needs and proactively suggests trip plans before you even ask.",
    tip: "Connect your Google or Outlook calendar in Settings → Integrations.",
  },
  {
    icon: MessageSquare,
    title: "Team Collaboration",
    description: "Coordinate travel plans with your team through integrated chat. Discuss trip details, share itineraries, and get approvals all in one place.",
    tip: "Access Chats from the main navigation to start collaborating.",
  },
  {
    icon: CreditCard,
    title: "Expense Management",
    description: "Track travel expenses automatically. Receipts are matched to trips, and expense reports are generated for easy approval and reimbursement.",
    tip: "Your corporate card can be linked in Settings → Travel Preferences.",
  },
  {
    icon: Users,
    title: "Team Overview",
    description: "Managers can view their team's travel schedules, approve requests, and ensure everyone stays within policy.",
    tip: "Visit the Team tab to see who's traveling and when.",
  },
  {
    icon: Settings,
    title: "Personalize Your Experience",
    description: "Set your seat preferences, meal choices, favorite airlines, and hotel brands. FlyBy remembers and applies them to every booking.",
    tip: "You're already here! Explore Settings to customize everything.",
  },
];

export function ProductTourModal({ open, onOpenChange }: ProductTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    setCompletedSteps([...completedSteps, currentStep]);
    onOpenChange(false);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const handleSkip = () => {
    onOpenChange(false);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === tourSteps.length - 1;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-secondary">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6">
          <DialogHeader className="text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-medium">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs">
                Skip tour
              </Button>
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <StepIcon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <div>
                <DialogTitle className="text-xl mb-2">{step.title}</DialogTitle>
                <DialogDescription className="text-base leading-relaxed">
                  {step.description}
                </DialogDescription>
              </div>

              {/* Tip */}
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-sm">
                  <span className="font-medium text-primary">💡 Tip: </span>
                  {step.tip}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-6 mb-4">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-6 bg-primary"
                    : completedSteps.includes(index)
                    ? "bg-primary/50"
                    : "bg-secondary"
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {isLastStep ? (
              <Button onClick={handleFinish} className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Finish Tour
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-1">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
