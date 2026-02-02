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

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.session && req.session.adminId) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // --- Auth Routes ---
  app.post(api.auth.login.path, async (req, res) => {
    const { username, password } = req.body;
    const admin = await storage.getAdminByUsername(username);

    if (!admin || !(await comparePassword(password, admin.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    (req.session as any).adminId = admin.id;
    res.json({ message: "Logged in successfully" });
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if ((req.session as any).adminId) {
      const admin = await storage.getAdminByUsername("admin"); // Simplify: just check session
      // In real app we'd fetch by ID, but storage only has getByUsername currently and we know it's admin.
      // Let's just return the session info or null
      return res.json({ username: "admin" });
    }
    res.json(null);
  });


  // --- Services Routes ---
  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.get(api.services.get.path, async (req, res) => {
    const service = await storage.getService(Number(req.params.id));
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.json(service);
  });

  app.post(api.services.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.services.create.input.parse(req.body);
      const service = await storage.createService(input);
      res.status(201).json(service);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  // --- Appointments Routes ---
  app.post(api.appointments.create.path, async (req, res) => {
    try {
      const input = api.appointments.create.input.parse(req.body);
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

  app.get(api.appointments.list.path, requireAuth, async (req, res) => {
    const appointments = await storage.getAppointments();
    res.json(appointments);
  });

  app.patch(api.appointments.updateStatus.path, requireAuth, async (req, res) => {
    const { status } = req.body;
    const updated = await storage.updateAppointmentStatus(Number(req.params.id), status);
    if (!updated) return res.status(404).json({ message: "Appointment not found" });
    res.json(updated);
  });


  // --- Seeding ---
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Check if admin exists
  const admin = await storage.getAdminByUsername("admin");
  if (!admin) {
    const hashedPassword = await hashPassword("admin123");
    await storage.createAdmin({ username: "admin", password: hashedPassword });
    console.log("Admin user seeded");
  }

  // Check if services exist
  const services = await storage.getServices();
  if (services.length === 0) {
    await storage.createService({
      name: "Haircut",
      description: "Classic haircut with scissors and machine.",
      price: 8000,
      duration: 30,
    });
    await storage.createService({
      name: "Beard Trim",
      description: "Beard shaping and trimming with razor finish.",
      price: 5000,
      duration: 20,
    });
    await storage.createService({
      name: "Full Service",
      description: "Haircut + Beard Trim + Hot Towel.",
      price: 12000,
      duration: 50,
    });
    console.log("Services seeded");
  }
}
