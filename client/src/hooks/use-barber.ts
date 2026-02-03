import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertAppointment } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// ==========================================
// SERVICES HOOKS
// ==========================================

export function useServices() {
  return useQuery({
    queryKey: [api.services.list.path],
    queryFn: async () => {
      const res = await fetch(api.services.list.path);
      if (!res.ok) throw new Error("Error al obtener los servicios");
      return api.services.list.responses[200].parse(await res.json());
    },
  });
}

// ==========================================
// APPOINTMENT HOOKS
// ==========================================

export function useAvailability(date: string) {
  return useQuery({
    queryKey: [api.appointments.checkAvailability.path, date],
    queryFn: async () => {
      if (!date) return [];
      const res = await fetch(`${api.appointments.checkAvailability.path}?date=${date}`);
      if (!res.ok) throw new Error("Error al obtener disponibilidad");
      return api.appointments.checkAvailability.responses[200].parse(await res.json());
    },
    enabled: !!date,
  });
}

export function useCreateAppointment() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertAppointment) => {
      const res = await fetch(api.appointments.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.appointments.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Error al crear la reserva");
      }
      return api.appointments.create.responses[201].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Error en la reserva",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useAppointments() {
  return useQuery({
    queryKey: [api.appointments.list.path],
    queryFn: async () => {
      const res = await fetch(api.appointments.list.path);
      if (!res.ok) {
        if (res.status === 401) throw new Error("No autorizado");
        throw new Error("Error al obtener los turnos");
      }
      return api.appointments.list.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "confirmed" | "cancelled" }) => {
      const res = await fetch(api.appointments.updateStatus.path.replace(":id", String(id)), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Error al actualizar el estado");
      return api.appointments.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] });
      toast({ title: "Estado Actualizado", description: "El estado del turno se actualizó correctamente." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    }
  });
}
