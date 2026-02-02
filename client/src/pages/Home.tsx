import { useState } from "react";
import { useServices, useCreateAppointment } from "@/hooks/use-barber";
import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Scissors, Calendar as CalIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// Steps constants
const STEPS = ["Service", "Date", "Time", "Details", "Confirm"];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Booking State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState({ name: "", whatsapp: "" });
  const [isSuccess, setIsSuccess] = useState(false);

  // Queries & Mutations
  const { data: services, isLoading: isLoadingServices } = useServices();
  const createAppointment = useCreateAppointment();

  // Helper logic
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
  ];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    try {
      await createAppointment.mutateAsync({
        serviceId: selectedService.id,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        clientName: clientDetails.name,
        clientWhatsapp: clientDetails.whatsapp,
      });
      setIsSuccess(true);
    } catch (error) {
      // Handled by hook
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you, {clientDetails.name}. Your appointment for {selectedService?.name} is set for {selectedDate && format(selectedDate, "MMMM do", { locale: es })} at {selectedTime}.
          </p>
          <Button 
            className="w-full h-12 text-lg mt-8" 
            onClick={() => window.location.reload()}
          >
            Book Another
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Section */}
      <header className="relative bg-black text-white py-24 overflow-hidden">
         {/* barber shop interior vintage dark luxury */}
        <div className="absolute inset-0 z-0 opacity-40">
           <img 
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80" 
            alt="Barber Shop Interior" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
        
        <div className="relative z-20 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-4 tracking-tight">
              El Don <span className="text-primary">Barber Shop</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-light">
              Premium cuts, classic shaves, and a timeless experience.
            </p>
          </motion.div>
        </div>
        
        {/* Admin Link (Hidden-ish) */}
        <div className="absolute top-4 right-4 z-30">
          <Link href="/admin/login" className="text-xs text-white/30 hover:text-white transition-colors">Staff Login</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 -mt-10 relative z-30">
        <div className="bg-card border border-border/50 shadow-xl rounded-2xl overflow-hidden min-h-[600px]">
          {/* Progress Bar */}
          <div className="bg-muted h-1.5 w-full">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / 5) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-6 md:p-10">
            {/* Step Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Step {currentStep + 1} of 5</p>
                <h2 className="text-2xl md:text-3xl font-display font-bold">
                  {STEPS[currentStep] === "Service" && "Select a Service"}
                  {STEPS[currentStep] === "Date" && "Choose a Date"}
                  {STEPS[currentStep] === "Time" && "Pick a Time"}
                  {STEPS[currentStep] === "Details" && "Your Information"}
                  {STEPS[currentStep] === "Confirm" && "Confirm Appointment"}
                </h2>
              </div>
              
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              )}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="min-h-[400px]"
              >
                {/* STEP 1: Services */}
                {currentStep === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoadingServices ? (
                      <div className="col-span-full flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : services?.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        selected={selectedService?.id === service.id}
                        onSelect={(s) => {
                          setSelectedService(s);
                          handleNext();
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* STEP 2: Date */}
                {currentStep === 1 && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if(date) handleNext();
                      }}
                      disabled={(date) => date < new Date() || date < addDays(new Date(), -1)}
                      className="rounded-xl border border-border shadow-sm bg-background p-6"
                    />
                  </div>
                )}

                {/* STEP 3: Time */}
                {currentStep === 2 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => {
                          setSelectedTime(time);
                          handleNext();
                        }}
                        className={cn(
                          "py-3 px-2 rounded-lg text-sm font-semibold border transition-all",
                          selectedTime === time
                            ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20"
                            : "bg-background border-border hover:border-primary/50 hover:bg-muted"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}

                {/* STEP 4: Details */}
                {currentStep === 3 && (
                  <div className="max-w-md mx-auto space-y-6 pt-8">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={clientDetails.name}
                        onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                        className="h-12 text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input
                        id="whatsapp"
                        placeholder="e.g. 11 1234 5678"
                        type="tel"
                        value={clientDetails.whatsapp}
                        onChange={(e) => setClientDetails({ ...clientDetails, whatsapp: e.target.value })}
                        className="h-12 text-lg"
                      />
                      <p className="text-xs text-muted-foreground">We'll send your confirmation here.</p>
                    </div>
                    
                    <Button 
                      className="w-full h-12 text-lg mt-8 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                      onClick={handleNext}
                      disabled={!clientDetails.name || !clientDetails.whatsapp}
                    >
                      Review Booking <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </div>
                )}

                {/* STEP 5: Confirmation */}
                {currentStep === 4 && (
                  <div className="max-w-xl mx-auto">
                    <Card className="border-2 border-primary/20 bg-primary/5">
                      <CardContent className="p-8 space-y-6">
                        <div className="flex items-start gap-4 pb-6 border-b border-primary/10">
                          <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <Scissors className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Service</h4>
                            <p className="text-xl font-bold font-display">{selectedService?.name}</p>
                            <p className="text-primary font-medium mt-1">$ {selectedService?.price.toLocaleString("es-AR")}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-primary/10">
                          <div className="flex items-center gap-3">
                            <CalIcon className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                              <p className="font-semibold">{selectedDate && format(selectedDate, "MMMM do, yyyy")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Time</h4>
                              <p className="font-semibold">{selectedTime}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Client</h4>
                          <p className="font-semibold text-lg">{clientDetails.name}</p>
                          <p className="text-muted-foreground">{clientDetails.whatsapp}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Button 
                      className="w-full h-14 text-lg mt-8 font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25"
                      onClick={handleBook}
                      disabled={createAppointment.isPending}
                    >
                      {createAppointment.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Confirming...
                        </>
                      ) : (
                        "Confirm Appointment"
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 mt-20 text-center text-muted-foreground text-sm">
        <p>© 2024 El Don Barber Shop. All rights reserved.</p>
      </footer>
    </div>
  );
}
