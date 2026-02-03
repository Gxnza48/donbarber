import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePassword(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashed, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.session && req.session.adminId) {
      next();
    } else {
      res.status(401).json({ message: "No autorizado" });
    }
  };

  app.post(api.auth.login.path, async (req, res) => {
    const { username, password } = req.body;
    const admin = await storage.getAdminByUsername(username);

    if (!admin || !(await comparePassword(password, admin.password))) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    (req.session as any).adminId = admin.id;
    res.json({ message: "Sesión iniciada correctamente" });
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Sesión cerrada" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if ((req.session as any).adminId) {
      return res.json({ username: "admin" });
    }
    res.json(null);
  });

  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.post(api.appointments.create.path, async (req, res) => {
    try {
      const input = api.appointments.create.input.parse(req.body);
      const booked = await storage.getConfirmedAppointmentsByDate(input.date);
      if (booked.some(a => a.time === input.time)) {
        return res.status(400).json({ message: "Este horario ya ha sido reservado" });
      }
      const appointment = await storage.createAppointment(input);
      res.status(201).json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.get(api.availability.path, async (req, res) => {
    const date = req.query.date as string;
    if (!date) return res.status(400).json({ message: "Fecha requerida" });
    const appointments = await storage.getConfirmedAppointmentsByDate(date);
    res.json(appointments.map(a => a.time));
  });

  app.get(api.appointments.list.path, requireAuth, async (req, res) => {
    const appointments = await storage.getAppointments();
    res.json(appointments);
  });

  app.patch(api.appointments.updateStatus.path, requireAuth, async (req, res) => {
    const { status } = req.body;
    const updated = await storage.updateAppointmentStatus(Number(req.params.id), status);
    if (!updated) return res.status(404).json({ message: "Turno no encontrado" });
    res.json(updated);
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const admin = await storage.getAdminByUsername("admin");
  if (!admin) {
    const hashedPassword = await hashPassword("admin123");
    await storage.createAdmin({ username: "admin", password: hashedPassword });
  }

  const existingServices = await storage.getServices();
  if (existingServices.length !== 2 || !existingServices.find(s => s.name === "Corte de Pelo")) {
    await storage.clearServices();
    await storage.createService({
      name: "Corte de Pelo",
      description: "Corte clásico con tijera y máquina.",
      price: 8000,
      duration: 30,
    });
    await storage.createService({
      name: "Mechas",
      description: "Servicio de color y mechas personalizadas.",
      price: 20000,
      duration: 120,
    });
  }
}
