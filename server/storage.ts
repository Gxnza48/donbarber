import { db } from "./db";
import {
  services, appointments, admins,
  type Service, type InsertService,
  type Appointment, type InsertAppointment,
  type Admin
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Services
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  clearServices(): Promise<void>;

  // Appointments
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointments(): Promise<Appointment[]>;
  getConfirmedAppointmentsByDate(date: string): Promise<Appointment[]>;
  updateAppointmentStatus(id: number, status: "pending" | "confirmed" | "cancelled"): Promise<Appointment | undefined>;

  // Admins
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: {username: string, password: string}): Promise<Admin>;
}

export class DatabaseStorage implements IStorage {
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async clearServices(): Promise<void> {
    await db.delete(services);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(desc(appointments.date), desc(appointments.time));
  }

  async getConfirmedAppointmentsByDate(date: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(
      and(
        eq(appointments.date, date),
        eq(appointments.status, "confirmed")
      )
    );
  }

  async updateAppointmentStatus(id: number, status: "pending" | "confirmed" | "cancelled"): Promise<Appointment | undefined> {
    const [updated] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin;
  }

  async createAdmin(admin: {username: string, password: string}): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }
}

export const storage = new DatabaseStorage();
