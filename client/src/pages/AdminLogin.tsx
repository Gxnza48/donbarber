import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, User } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn, user } = useAuth();
  const [_, setLocation] = useLocation();

  if (user) {
    setLocation("/admin");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password }, {
      onSuccess: () => setLocation("/admin")
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
         <img 
          src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80" 
          alt="Barber Background" 
          className="w-full h-full object-cover grayscale"
        />
      </div>

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 z-10 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
            <User size={32} />
          </div>
          <h2 className="text-3xl font-display font-bold text-primary">Acceso Admin</h2>
          <CardDescription className="text-zinc-400">
            Inicia sesión para gestionar los turnos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-zinc-300">Usuario</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus:border-primary/50"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
