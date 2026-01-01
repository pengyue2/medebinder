import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Hand, Target, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

const TUTORIAL_STEPS = [
  {
    icon: Hand,
    title: "Swipe to Sort",
    subtext: "Right to Keep, Left to Archive.",
  },
  {
    icon: Target,
    title: "Daily 10",
    subtext: "Small batches. No stress.",
  },
  {
    icon: Image,
    title: "Create Memories",
    subtext: "Turn your favorites into collectibles.",
  },
];

const TutorialOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (!hasSeenTutorial) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative glass-strong rounded-2xl p-8 max-w-sm w-full shadow-xl border border-border/50"
        >
          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon with animations */}
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                {currentStep === 0 && (
                  <motion.div
                    animate={{ x: [0, 15, 0, -15, 0] }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      repeatDelay: 0.5
                    }}
                  >
                    <Icon className="w-12 h-12 text-primary" />
                  </motion.div>
                )}
                {currentStep === 1 && (
                  <motion.div
                    className="relative"
                  >
                    <Icon className="w-12 h-12 text-primary" />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "linear"
                      }}
                    >
                      <div className="w-16 h-16 rounded-full border-2 border-transparent border-t-primary/50 border-r-primary/30" />
                    </motion.div>
                  </motion.div>
                )}
                {currentStep === 2 && (
                  <motion.div
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      repeatDelay: 1
                    }}
                    style={{ perspective: 1000 }}
                  >
                    <Icon className="w-12 h-12 text-primary" />
                  </motion.div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {step.title}
              </h2>

              {/* Subtext */}
              <p className="text-muted-foreground text-base">
                {step.subtext}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`${currentStep === 0 ? "invisible" : ""}`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              className="min-w-[100px]"
            >
              {isLastStep ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialOverlay;
