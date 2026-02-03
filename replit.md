# El Don Barber Shop - Appointment Booking System

## Overview

A production-ready appointment booking web application for "El Don Barber Shop", a Spanish Latin American barber shop. The application allows customers to browse services, select available time slots, and book appointments. It includes an admin dashboard for managing appointments and services. All pricing uses Argentine Peso (ARS) formatting (e.g., $8.000).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for step transitions in booking flow
- **Date Handling**: date-fns with Spanish (es) locale support

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/` (Home, AdminLogin, AdminDashboard)
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Custom hooks in `client/src/hooks/` for data fetching and authentication

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts`
- **Authentication**: Session-based auth using express-session with MemoryStore
- **Password Security**: scrypt hashing with salt for admin passwords

The server follows a layered architecture:
- Routes defined in `server/routes.ts`
- Data access through storage abstraction in `server/storage.ts`
- Database connection in `server/db.ts`

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod validation (drizzle-zod)
- **Schema Location**: `shared/schema.ts`

Database tables:
- `services`: Barber services with name, description, price (ARS), duration (minutes)
- `appointments`: Customer bookings with client info, service, date/time, status
- `admins`: Admin users for dashboard access

### Authentication & Authorization
- Session-based authentication for admin panel
- Sessions stored in memory (MemoryStore) with 24-hour expiry
- Protected routes require `adminId` in session
- Password hashing using Node.js crypto scrypt

### Build System
- **Development**: Vite for frontend hot module replacement
- **Production Build**: esbuild bundles server, Vite builds client
- **Output**: `dist/` directory with `index.cjs` and `public/` folder

## External Dependencies

### Database
- PostgreSQL (connection via `DATABASE_URL` environment variable)
- Drizzle Kit for database migrations (`npm run db:push`)

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-zod`: Database ORM and validation
- `express-session` / `memorystore`: Session management
- `framer-motion`: Animations
- `date-fns`: Date manipulation and formatting
- `zod`: Runtime type validation

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Development tooling
- `@replit/vite-plugin-dev-banner`: Development environment indicator

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption (optional, has default)