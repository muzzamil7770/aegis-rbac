# Aegis 🛡️ | Multi-Tenant RBAC Console

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Knex.js](https://img.shields.io/badge/Knex.js-E16426?style=for-the-badge&logo=knex&logoColor=white)](https://knexjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-074D5B?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MySQL](https://img.shields.io/badge/MySQL-00758F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

Aegis is a production-grade, state-of-the-art **Multi-Tenant Role-Based Access Control (RBAC) System** featuring a beautiful, interactive Tailwind CSS admin console and a robust, secure Express.js server. Aegis implements dynamic role definitions, module-grouped permissions matrix control, tenant-isolated data scopes, and non-blocking security audit trails.

---

## 🚀 Key Features

* **Strict Multi-Tenancy**: Automated database queries isolation mapping all resources with index-optimized `tenant_id` boundaries.
* **Dynamic RBAC Gates**: Create custom roles and associate fine-grained permissions. System-defined base roles (`Owner`, `Admin`, `Member`, `Viewer`) safeguard tenant integrity.
* **Safety Guards**: API level check prevents deleting oneself, deleting active system roles, modifying the Owner role's permissions, or removing active roles that are assigned to team members.
* **Audit Trails & Security Logs**: Asynchronous, non-blocking logs recording client metadata (IP, user-agent, changes details) while automatically redacting passwords.
* **Multi-DB Support (PostgreSQL / XAMPP MySQL)**: Abstracted database query layer using **Knex.js** with zero-config SQLite local database enabled on start.
* **Premium Dashboard UI**: Outfitted with dark mode glassmorphism panels, interactive tables, modular sliders/modals, and Recharts traffic timeline graphs.

---

## 🎨 UI Showcase

The dashboard features premium layout cards, responsive navigation, and real-time security tracking feeds:

```text
+-----------------------------------------------------------------------------------+
|  AEGIS  🛡️   |  Security Overview Dashboard                         [Owner] [Dev]  |
+----------------------+------------------------------------------------------------+
|                      |                                                            |
|  [D] Dashboard       |   Total Users       Active Roles      Audited Actions      |
|  [U] Users Mgmt      |   [ 2 Users ]       [ 5 Roles ]       [ 14 Events ]        |
|  [R] Roles & Perms   |                                                            |
|  [A] Audit Logs      |   +----------------------------------------------------+   |
|                      |   | Security Actions Timeline (Live Feed Chart)        |   |
|                      |   |   /\                                               |   |
|                      |   |  /  \__/\_                                         |   |
|  [User] John Doe     |   +----------------------------------------------------+   |
|  john@acme.com       |                                                            |
|  [Sign Out]          |   Recent Operations: user.create (Jane Doe), auth.login... |
+----------------------+------------------------------------------------------------+
```

---

## 📁 Repository Directory Structure

```text
rbac-system/
├── backend/
│   ├── src/
│   │   ├── config/             # DB & server configs (Knex config)
│   │   ├── controllers/        # Express handlers (auth, users, roles, audit)
│   │   ├── db/                 # DB Client wrapper & SQLite key hook
│   │   ├── middleware/         # Auth, Tenant context, RBAC validation
│   │   ├── routes/             # API Router definitions
│   │   ├── services/           # Audit logging service & token service
│   │   └── app.js              # Server entry point
│   ├── .env.example            # Sample configuration settings
│   ├── package.json            # Node backend manifest
│   └── knexfile.js             # Knex migration & DB details
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared components (Sidebar, Header, StatCard, Modal)
│   │   ├── context/            # AuthContext (permissions checker helper)
│   │   ├── pages/              # Views (Dashboard, Users, Roles, AuditLogs, Login, Register)
│   │   ├── services/           # Axios API wrapper (automatic JWT interception)
│   │   ├── App.jsx             # Main routing and UI wrapper
│   │   ├── index.css           # Global custom typography & Tailwind CSS
│   │   └── main.jsx            # React root mount
│   ├── index.html
│   ├── tailwind.config.js      # Custom theme setup
│   └── package.json            # React frontend manifest
```

---

## 📋 API Route Registry

### Authentication (`/api/auth`)
* `POST /register` - Register a new organization Tenant + Administrator account.
* `POST /login` - Sign in and compile JWT credentials.
* `GET /me` - Retrieve user profile settings and authority levels.

### Team Members (`/api/users`)
* `GET /` - List team members (`users:read`).
* `POST /` - Add a new user and map roles (`users:create`).
* `PUT /:id` - Update member details, roles, or status (`users:update`).
* `DELETE /:id` - Remove user from tenant scope (`users:delete`).

### Roles & Control Matrix (`/api/roles`)
* `GET /` - Retrieve roles list with permission coverage (`roles:read`).
* `POST /` - Create a custom workspace role (`roles:create`).
* `PUT /:id` - Edit role descriptions or toggle permissions (`roles:update`).
* `DELETE /:id` - Delete custom roles (`roles:delete`).
* `GET /permissions` - Retrieve static list of system permissions.

### Operations Audit Ledger (`/api/audit`)
* `GET /` - Search and paginate tenant audit trails (`audit:read`).

---

## ⚙️ Development Startup

### 1. Backend Server
```bash
cd backend
npm install
npm start
```
*Note: In development, SQLite is configured by default. The database file (`dev.sqlite`) is auto-created and pre-seeded with permissions on boot.*

### 2. Frontend Panel
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:3000/register` to register your tenant console.

---

## 🗄️ Database Adaptation Guide

The backend connection is powered by **Knex.js** for database independence. Modify `.env` variables to transition databases:

### 🐘 PostgreSQL Configuration
```ini
DB_CLIENT=pg
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=rbac_system
```

### 🐬 MySQL / XAMPP Configuration
```ini
DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=rbac_system
```
After changing the `.env` settings, synchronize database schemas:
```bash
cd backend
npm run db:migrate
```

---

## 🤝 Contribution and Conventional Commits

We follow the conventional commits specification to maintain a clean git history:

- `feat:` for new capabilities (e.g. `feat: add tenant filter to audit query`)
- `fix:` for bug resolutions (e.g. `fix: prevent self-deletion error in controller`)
- `docs:` for documentation updates (e.g. `docs: update setup steps in readme`)
- `chore:` for package or build configuration changes (e.g. `chore: upgrade vite`)

---

🛡️ Developed with care for enterprise scale security.
