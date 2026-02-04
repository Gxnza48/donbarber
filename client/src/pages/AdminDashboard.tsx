import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useAppointments,
  useUpdateAppointmentStatus,
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService
} from "@/hooks/use-barber";
import { useLocation } from "wouter";
import {
  Loader2, LogOut, Check, X, Calendar, DollarSign, Users,
  Search, Scissors, Plus, Pencil, Trash2
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
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminDashboard() {
  const { user, logout, isLoading: isLoadingAuth } = useAuth();
  const [_, setLocation] = useLocation();
  const { data: appointments, isLoading: isLoadingAppts } = useAppointments();
  const { data: services, isLoading: isLoadingServices } = useServices();
  const updateStatus = useUpdateAppointmentStatus();

  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("appointments");

  // Service Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 30
  });

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

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setServiceForm({ name: "", description: "", price: 0, duration: 30 });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditModal = (service: any) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration: service.duration
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async () => {
    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, ...serviceForm });
      } else {
        await createService.mutateAsync(serviceForm);
      }
      setIsServiceModalOpen(false);
    } catch (e) { }
  };

  const filteredAppointments = appointments?.filter(appt =>
    appt.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appt.date.includes(searchTerm)
  ).sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

  // Stats
  const totalAppointments = appointments?.length || 0;
  const todaysAppointments = appointments?.filter(a => isToday(new Date(a.date + 'T12:00:00'))).length || 0;
  const totalRevenue = appointments
    ?.filter(a => a.status === 'confirmed')
    .reduce((acc, curr) => acc + getServicePrice(curr.service_id), 0) || 0;

  // WhatsApp Link Helper
  const getWhatsAppLink = (appt: any) => {
    const phone = appt.client_whatsapp.replace(/\D/g, '');
    let message = "";

    if (appt.status === 'confirmed') {
      message = `Hola ${appt.client_name}, ¡tu turno para ${getServiceName(appt.service_id)} fue confirmado! Te esperamos el ${format(new Date(appt.date + 'T12:00:00'), 'd/MM')} a las ${appt.time} hs.`;
    } else if (appt.status === 'cancelled') {
      message = `Hola ${appt.client_name}, tu pedido fue rechazado mil perdones. Si querés podemos coordinar para otra fecha.`;
    } else {
      message = `Hola ${appt.client_name}, te escribo por tu turno para ${getServiceName(appt.service_id)}.`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

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
          <Card className="hover-elevate transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Turnos Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAppointments}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Turnos de Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todaysAppointments}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate transition-all duration-300 border-l-4 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 transition-colors">
                $ {totalRevenue.toLocaleString("es-AR")}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments" onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="appointments">Turnos</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="px-6 py-6 border-b bg-muted/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Gestión de Turnos</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 text-balance">
                    Podes filtrar, confirmar o cancelar pedidos, y contactar a los clientes.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full md:max-w-sm relative">
                  <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nombre o fecha (Ej: 2024-05)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 ring-offset-background"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingAppts ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-muted-foreground">Cargando la agenda...</span>
                  </div>
                ) : (
                  <>
                    {/* Desktop View Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[200px]">Cliente</TableHead>
                            <TableHead>Servicio</TableHead>
                            <TableHead>Fecha y Hora</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAppointments?.map((appt) => (
                            <TableRow key={appt.id} className="group hover:bg-muted/30 transition-colors">
                              <TableCell>
                                <div className="font-semibold">{appt.client_name}</div>
                                <a
                                  href={getWhatsAppLink(appt)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "text-sm inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-full transition-colors",
                                    appt.status === 'confirmed' ? "bg-green-100 text-green-700 hover:bg-green-200" :
                                      appt.status === 'cancelled' ? "bg-red-100 text-red-700 hover:bg-red-200" :
                                        "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                  )}
                                >
                                  <span className="w-2 h-2 rounded-full bg-current animate-pulse md:animate-none group-hover:animate-pulse" />
                                  {appt.client_whatsapp}
                                </a>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-medium">
                                  {getServiceName(appt.service_id)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{format(new Date(appt.date + 'T12:00:00'), 'd MMM, yyyy', { locale: es })}</span>
                                  <span className="text-muted-foreground text-sm">{appt.time} hs</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  "font-medium shadow-none",
                                  appt.status === 'confirmed' ? "bg-green-500 hover:bg-green-600" :
                                    appt.status === 'cancelled' ? "bg-destructive hover:bg-destructive/90" :
                                      "bg-zinc-200 text-zinc-800 hover:bg-zinc-300"
                                )}>
                                  {appt.status === 'pending' ? 'Pendiente' :
                                    appt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                {appt.status === 'pending' && (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => updateStatus.mutate({ id: appt.id, status: 'confirmed' })}
                                      disabled={updateStatus.isPending}
                                    >
                                      <Check className="h-4 w-4 mr-1" /> Confirmar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => updateStatus.mutate({ id: appt.id, status: 'cancelled' })}
                                      disabled={updateStatus.isPending}
                                    >
                                      <X className="h-4 w-4 mr-1" /> Rechazar
                                    </Button>
                                  </div>
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
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile View Cards */}
                    <div className="md:hidden divide-y divide-border">
                      {filteredAppointments?.map((appt) => (
                        <div key={appt.id} className="p-4 space-y-4 active:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg">{appt.client_name}</h3>
                              <a
                                href={getWhatsAppLink(appt)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "text-sm inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-lg border",
                                  appt.status === 'confirmed' ? "bg-green-50 border-green-200 text-green-700" :
                                    appt.status === 'cancelled' ? "bg-red-50 border-red-200 text-red-700" :
                                      "bg-zinc-50 border-zinc-200 text-zinc-600"
                                )}
                              >
                                <span className="w-2 h-2 rounded-full bg-current" />
                                {appt.client_whatsapp}
                              </a>
                            </div>
                            <Badge className={cn(
                              "shadow-none",
                              appt.status === 'confirmed' ? "bg-green-500" :
                                appt.status === 'cancelled' ? "bg-destructive" : "bg-zinc-200 text-zinc-800"
                            )}>
                              {appt.status === 'pending' ? 'Pendiente' :
                                appt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Scissors className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium">{getServiceName(appt.service_id)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>{format(new Date(appt.date + 'T12:00:00'), 'd/MM')} • {appt.time} hs</span>
                              </div>
                            </div>

                            {appt.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="h-10 bg-green-600 hover:bg-green-700 text-white flex-1"
                                  onClick={() => updateStatus.mutate({ id: appt.id, status: 'confirmed' })}
                                  disabled={updateStatus.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-10 flex-1"
                                  onClick={() => updateStatus.mutate({ id: appt.id, status: 'cancelled' })}
                                  disabled={updateStatus.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {(!filteredAppointments || filteredAppointments.length === 0) && (
                      <div className="p-12 text-center text-muted-foreground">
                        No encontramos turnos con esos criterios.
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="px-6 py-6 border-b bg-muted/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Catálogo de Servicios</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gestioná los servicios que los clientes pueden reservar.
                  </p>
                </div>
                <Button onClick={handleOpenCreateModal} className="gap-2 w-full md:w-auto">
                  <Plus className="w-4 h-4" /> Nuevo Servicio
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingServices ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span>Cargando servicios...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services?.map((service) => (
                          <TableRow key={service.id} className="group hover:bg-muted/30">
                            <TableCell>
                              <div className="font-semibold">{service.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                                {service.description || "Sin descripción"}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              $ {service.price.toLocaleString("es-AR")}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {service.duration} min
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleOpenEditModal(service)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 border-red-100"
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de eliminar "${service.name}"?`)) {
                                    deleteService.mutate(service.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Service Dialog */}
        <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingService ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
              <DialogDescription>
                Completá los detalles del servicio. Se actualizará en la web automáticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="service-name">Nombre</Label>
                <Input
                  id="service-name"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Ej: Corte Degradé"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-description">Descripción</Label>
                <Textarea
                  id="service-description"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Contanos un poco sobre el servicio..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="service-price">Precio ($)</Label>
                  <Input
                    id="service-price"
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="service-duration">Duración (min)</Label>
                  <Input
                    id="service-duration"
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsServiceModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveService} disabled={createService.isPending || updateService.isPending}>
                {createService.isPending || updateService.isPending ? "Guardando..." : (editingService ? "Guardar Cambios" : "Crear Servicio")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
