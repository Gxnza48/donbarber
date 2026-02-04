import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { InsertAppointment } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

// ==========================================
// SERVICES HOOKS
// ==========================================

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("id");

      if (error) {
        console.error("Error al cargar servicios de Supabase:", error);
        throw new Error("Error al obtener los servicios: " + error.message);
      }
      return data;
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newService: { name: string; description: string; price: number; duration: number; image_url?: string }) => {
      const { data, error } = await supabase
        .from("services")
        .insert(newService)
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Servicio Creado", description: "El servicio se agregó correctamente." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...update }: { id: number; name?: string; description?: string; price?: number; duration?: number; image_url?: string }) => {
      const { data, error } = await supabase
        .from("services")
        .update(update)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw new Error(`Error BD: ${error.message}`);
      if (!data) throw new Error("No se pudo encontrar el servicio. Verificá los permisos de Supabase.");

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Servicio Actualizado", description: "Los cambios se guardaron correctamente." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Servicio Eliminado", description: "El servicio se eliminó de la lista." });
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo eliminar el servicio. Puede que tenga turnos asociados.", variant: "destructive" });
    }
  });
}

// ==========================================
// APPOINTMENT HOOKS
// ==========================================

export function useAvailability(date: string) {
  return useQuery({
    queryKey: ["availability", date],
    queryFn: async () => {
      if (!date) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("time")
        .eq("date", date)
        .neq("status", "cancelled");

      if (error) throw new Error("Error al obtener disponibilidad");
      return data?.map(a => a.time) ?? [];
    },
    enabled: !!date,
  });
}

export function useCreateAppointment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertAppointment) => {
      // Verificar disponibilidad primero
      const { data: existing } = await supabase
        .from("appointments")
        .select("id")
        .eq("date", data.date)
        .eq("time", data.time)
        .neq("status", "cancelled")
        .maybeSingle();

      if (existing) {
        throw new Error("Este horario ya ha sido reservado");
      }

      const { data: newAppointment, error } = await supabase
        .from("appointments")
        .insert({
          client_name: data.client_name,
          client_whatsapp: data.client_whatsapp,
          service_id: data.service_id,
          date: data.date,
          time: data.time,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw new Error("Error al crear la reserva");
      return newAppointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
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
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("date", { ascending: false })
        .order("time", { ascending: false });

      if (error) throw new Error("Error al obtener los turnos");
      return data;
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "confirmed" | "cancelled" }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw new Error("Error al actualizar el estado");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Estado Actualizado", description: "El estado del turno se actualizó correctamente." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    }
  });
}
