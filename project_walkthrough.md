# Aegis Secure Multi-Tenant RBAC System Walkthrough

This document guides you through the codebase, features, setup, and database transitions for the **Aegis Multi-Tenant Role-Based Access Control (RBAC) System**.

---

## 1. Application Testing Flow (Browser Replay)

Below is the recorded browser session demonstrating the signup of a new organization, dynamic configuration of a custom role and its permissions, user creation, and audit logging.

![Aegis RBAC Flow Replay](C:\Users\Administrator\.gemini\antigravity\brain\0a7afb67-d5fd-474a-ba92-79fffd2786f4\artifacts\rbac_system_flow.webp)

---

## 2. Key Features Implemented

1. **True Multi-Tenancy**
   - Separate organization workspace contexts resolved securely through client registration and login.
   - Database queries automatically isolated using `tenant_id` scopes to block cross-tenant leakage.

2. **Dynamic Role-Based Access Control (RBAC)**
   - Pre-seeded base configurations for system-defined roles: `Owner`, `Admin`, `Member`, and `Viewer`.
   - Administrators can dynamically design custom roles (e.g. *Support Manager*) and bind fine-grained permissions.
   - Built-in UI and API protection barriers:
     - Prevents deactivating or deleting your own active account.
     - Protects system roles against deletion.
     - Prevents modifying the permissions of the `Owner` role to avoid permanent administrative lockouts.
     - Enforces that a role cannot be deleted if it is currently assigned to users.

3. **Asynchronous Security Auditing**
   - Non-blocking audit logger records system events (login success/failures, registrations, CRUD modifications).
   - Detail inspection panel permits viewing exact request changes, user agent descriptors, and client IPs.
   - Logs redact sensitive attributes (like passwords) before write operations.

4. **Premium Tailwind UI Panel**
   - High-fidelity interface styled with a custom dark palette (`slate-950`, deep violet accents, glassmorphic panels).
   - Custom-themed charts showing system traffic and security logs using Recharts.
   - Consistent typography utilizing the `Outfit` font for titles and `Inter` for interfaces.

---

## 3. Getting Started

The project is structured into `backend` and `frontend` folders. It is pre-configured with a zero-config local SQLite database client so it can be run instantly without database configuration.

### Prerequisites
- Node.js (v18 or higher)
- npm

### Step 1: Start the Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Start the server:
   ```bash
   npm start
   ```
   *Note: In SQLite mode, the server automatically initializes the database file (`dev.sqlite`), creates the tables, and seeds permissions on startup.*

### Step 2: Start the Frontend
1. Open a second terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to **`http://localhost:3000/register`** to create your first organization tenant.

---

## 4. Production Database Configuration

The application utilizes **Knex.js** as a database wrapper. This allows you to switch between **PostgreSQL**, **MySQL/MariaDB (XAMPP)**, and **SQLite** by changing a single variable in your `.env` configuration file without rewriting any backend code.

### PostgreSQL Setup
1. Create a database in PostgreSQL (e.g. `rbac_system`).
2. Open `backend/.env` and adjust the settings:
   ```ini
   DB_CLIENT=pg
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_NAME=rbac_system
   DB_SSL=false
   ```
3. Run the migrations and seeds from the `backend` folder:
   ```bash
   npm run db:migrate
   ```

### MySQL / XAMPP MariaDB Setup
1. Launch XAMPP and start the MySQL module.
2. Create a database via phpMyAdmin (e.g. `rbac_system`).
3. Open `backend/.env` and update the settings:
   ```ini
   DB_CLIENT=mysql2
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=            # Leave blank if default XAMPP configuration
   DB_NAME=rbac_system
   ```
4. Run the database migrations in the `backend` folder:
   ```bash
   npm run db:migrate
   ```

---

## 5. Directory Mapping and Key Files

- **`backend/src/app.js`**: Server configuration, Helmets security setup, health routing, and central error boundaries.
- **`backend/src/db/index.js`**: Knex client bootloader with explicit SQLite foreign key triggers.
- **`backend/src/middleware/auth.js`**: JWT verification, token unpacking, and permissions validation guards (`requirePermission`).
- **`backend/src/controllers/authController.js`**: Tenant signup seeder, security token compiling, and logins.
- **`frontend/src/context/AuthContext.jsx`**: Global authentication provider exposing session details and checking permissions dynamically.
- **`frontend/src/pages/Dashboard.jsx`**: Responsive cards, recent activities grid, and Recharts logs graph.
- **`frontend/src/pages/Users.jsx`**: User administration forms, status selectors, and role assignment checklists.
- **`frontend/src/pages/Roles.jsx`**: Permission grid checkbox matrices grouped by functional modules.
- **`frontend/src/pages/AuditLogs.jsx`**: Pagination, query filters, and payload codeblock detail inspectors.
