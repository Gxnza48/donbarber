import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments, useUpdateAppointmentStatus, useServices } from "@/hooks/use-barber";
import { useLocation } from "wouter";
import { 
  Loader2, LogOut, Check, X, Calendar, DollarSign, Users, 
  Search, Scissors
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminDashboard() {
  const { user, logout, isLoading: isLoadingAuth } = useAuth();
  const [_, setLocation] = useLocation();
  const { data: appointments, isLoading: isLoadingAppts } = useAppointments();
  const { data: services } = useServices();
  const updateStatus = useUpdateAppointmentStatus();
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoadingAuth) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) {
    setLocation("/admin/login");
    return null;
  }

  const getServicePrice = (serviceId: number) => {
    return services?.find(s => s.id === serviceId)?.price || 0;
  };
  
  const getServiceName = (serviceId: number) => {
    return services?.find(s => s.id === serviceId)?.name || "Desconocido";
  };

  const filteredAppointments = appointments?.filter(appt => 
    appt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appt.date.includes(searchTerm)
  ).sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

  // Stats
  const totalAppointments = appointments?.length || 0;
  const todaysAppointments = appointments?.filter(a => isToday(new Date(a.date + 'T12:00:00'))).length || 0;
  const totalRevenue = appointments
    ?.filter(a => a.status === 'confirmed')
    .reduce((acc, curr) => acc + getServicePrice(curr.serviceId), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-display font-bold">El Don <span className="text-primary">Admin</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden md:block">Hola, {user.username}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" /> Salir
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turnos Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAppointments}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turnos de Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysAppointments}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">$ {totalRevenue.toLocaleString("es-AR")}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="px-6 py-4 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>Gestión de Turnos</CardTitle>
            <div className="flex items-center gap-2 w-full md:max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o fecha..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingAppts ? (
              <div className="p-8 text-center text-muted-foreground">Cargando turnos...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments?.map((appt) => (
                      <TableRow key={appt.id}>
                        <TableCell>
                          <div className="font-medium">{appt.clientName}</div>
                          <div className="text-sm text-muted-foreground">{appt.clientWhatsapp}</div>
                        </TableCell>
                        <TableCell>{getServiceName(appt.serviceId)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{format(new Date(appt.date + 'T12:00:00'), 'd MMM, yyyy', { locale: es })}</span>
                            <span className="text-muted-foreground text-sm">{appt.time} hs</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            appt.status === 'confirmed' ? 'default' : 
                            appt.status === 'cancelled' ? 'destructive' : 'secondary'
                          }>
                            {appt.status === 'pending' ? 'Pendiente' : 
                             appt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {appt.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                onClick={() => updateStatus.mutate({ id: appt.id, status: 'confirmed' })}
                                disabled={updateStatus.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                onClick={() => updateStatus.mutate({ id: appt.id, status: 'cancelled' })}
                                disabled={updateStatus.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {appt.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-xs h-8 text-red-500 hover:bg-red-50"
                              onClick={() => updateStatus.mutate({ id: appt.id, status: 'cancelled' })}
                              disabled={updateStatus.isPending}
                            >
                              Cancelar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAppointments?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No se encontraron turnos.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
