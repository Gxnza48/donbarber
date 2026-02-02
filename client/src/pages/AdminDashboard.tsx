import { useAuth } from "@/hooks/use-auth";
import { useAppointments, useUpdateAppointmentStatus, useServices } from "@/hooks/use-barber";
import { useLocation } from "wouter";
import { 
  Loader2, LogOut, Check, X, Calendar, DollarSign, Users, 
  Search, Filter
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
import { useState } from "react";
import { format, isToday } from "date-fns";

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
    return services?.find(s => s.id === serviceId)?.name || "Unknown";
  };

  const filteredAppointments = appointments?.filter(appt => 
    appt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appt.date.includes(searchTerm)
  ).sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

  // Stats
  const totalAppointments = appointments?.length || 0;
  const todaysAppointments = appointments?.filter(a => isToday(new Date(a.date))).length || 0;
  const todaysRevenue = appointments
    ?.filter(a => isToday(new Date(a.date)) && a.status !== 'cancelled')
    .reduce((acc, curr) => acc + getServicePrice(curr.serviceId), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-primary">El Don Admin</h1>
            <Badge variant="outline" className="text-xs">Dashboard</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden md:block">Hello, {user.username}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAppointments}</div>
              <p className="text-xs text-muted-foreground">All time appointments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysAppointments}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">$ {todaysRevenue.toLocaleString("es-AR")}</div>
              <p className="text-xs text-muted-foreground">Potential revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Appointments Table */}
        <Card className="border shadow-sm">
          <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
            <CardTitle>Appointments</CardTitle>
            <div className="flex items-center gap-2 max-w-sm w-full">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search name or date..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingAppts ? (
              <div className="p-8 text-center text-muted-foreground">Loading appointments...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          <span className="font-medium">{format(new Date(appt.date), 'MMM d, yyyy')}</span>
                          <span className="text-muted-foreground text-sm">{appt.time}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          appt.status === 'confirmed' ? 'default' : 
                          appt.status === 'cancelled' ? 'destructive' : 'secondary'
                        }>
                          {appt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {appt.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateStatus.mutate({ id: appt.id, status: 'confirmed' })}
                              disabled={updateStatus.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                            className="text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => updateStatus.mutate({ id: appt.id, status: 'cancelled' })}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAppointments?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No appointments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
