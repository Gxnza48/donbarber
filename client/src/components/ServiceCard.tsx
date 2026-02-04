import { cn } from "@/lib/utils";
import type { Service } from "@/lib/database.types";
import { Check } from "lucide-react";

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onSelect: (service: Service) => void;
}

export function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <div
      onClick={() => onSelect(service)}
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-300",
        selected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-border bg-card hover:border-primary/50 hover:shadow-md"
      )}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className={cn(
            "text-xl font-bold font-display transition-colors",
            selected ? "text-primary" : "text-foreground group-hover:text-primary/80"
          )}>
            {service.name}
          </h3>
          {selected && (
            <div className="bg-primary text-primary-foreground rounded-full p-1 animate-in fade-in zoom-in duration-200">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>

        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          {service.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-medium text-muted-foreground">
            {service.duration} min
          </span>
          <span className="text-lg font-bold text-foreground">
            $ {service.price.toLocaleString("es-AR")}
          </span>
        </div>
      </div>

      {/* Visual flair - decorative gradient line */}
      <div className={cn(
        "absolute bottom-0 left-0 h-1 w-full bg-primary transition-transform duration-300 origin-left",
        selected ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
      )} />
    </div>
  );
}
