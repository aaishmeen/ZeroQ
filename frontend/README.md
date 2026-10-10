# ZeroQ Frontend — React + TypeScript + Vite

This directory contains the user interface for **ZeroQ**, built with React 19, TypeScript, Vite, Tailwind CSS, and Lucide icons.

---

## Architecture & Role-Based Dashboards

The frontend is structured around 5 role-based dashboards tailored for university event workflows:

1. **Student Dashboard** (`src/components/dashboard/StudentDashboard.tsx`):
   - Browse active campus events & details.
   - Event registration & payment screenshot upload.
   - View approved QR tickets.
   - Submit disputes and apply for volunteer opportunities.

2. **Volunteer Dashboard** (`src/components/dashboard/VolunteerDashboard.tsx`):
   - Live camera QR Code scanner using `html5-qrcode`.
   - Real-time attendee check-in and scan verification.
   - View assigned tasks and volunteer notifications.

3. **Organizer Dashboard** (`src/components/dashboard/OrganizerDashboard.tsx`):
   - Create new events and view event status.
   - Manage registered attendees.
   - Publish volunteer openings and assign tasks.

4. **Admin Dashboard** (`src/components/dashboard/AdminDashboard.tsx`):
   - Event approval / rejection queue.
   - Payment screenshot verification portal.
   - User role overview and dispute resolution.

5. **Superadmin Dashboard** (`src/components/dashboard/SuperadminDashboard.tsx`):
   - Global system settings and admin account approval management.

---

## Local Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend dev server runs at `http://localhost:5173`.

---

## Environment Configuration

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## Available Scripts

- `npm run dev`: Start Vite development server with HMR.
- `npm run build`: Type-check and build production bundle into `dist/`.
- `npm run preview`: Preview production build locally.
- `npm run lint`: Run Oxlint linter.
