# Dasara Zone - Games & Participation Management

A full-stack web application designed for organizing sports and cultural events, managing participant registrations, game rosters, and real-time participation tracking with a responsive participation matrix.

Developed for **Dasara Zone** by **Alpha**.

---

## 🌟 Features

- **Event Participation Matrix**: Interactive grid with sticky headers and pinned participant columns, supporting smooth horizontal swipe on mobile and trackpad/mouse on desktop.
- **Participant Directory**: Register participants with Name, Age, Standard/Class (from LKG to 12th Standard & Other), and Section.
- **Game Management**: Dynamic creation, editing, and deletion of games with real-time participation statistics.
- **Export Options**:
  - Export Participants to CSV (with Excel UTF-8 BOM encoding)
  - Export Full Participation Matrix to CSV
  - Export Complete App Source Code as a `.zip` archive
- **Database & Persistence**: Built with Node.js SQLite with WAL mode for data safety, and ready for deployment to Cloudflare Pages + D1 or Node.js / Docker hosts.

---

## 🚀 How to Move This App to a New Git Repository

If you downloaded the `dasara-zone-app.zip` or want to push this project into a new repository (e.g. GitHub, GitLab, Bitbucket), follow these steps:

### Step 1: Unzip the project
If you downloaded `dasara-zone-app.zip`:
```bash
unzip dasara-zone-app.zip -d dasara-zone
cd dasara-zone
```

### Step 2: Initialize a Git Repository
```bash
# Initialize git inside the project root
git init

# (Optional) Set your default branch to main
git branch -M main

# Stage all files
git add .

# Create your first commit
git commit -m "Initial commit: Dasara Zone Games & Participation Management app"
```

### Step 3: Connect to Your New Remote Repository
1. Go to [GitHub](https://github.com/new) (or your preferred Git provider) and create a new empty repository (do **not** check "Initialize with README", "Add .gitignore", or "Choose a license" since they are already included).
2. Copy your new repository URL (e.g. `https://github.com/your-username/dasara-zone.git` or `git@github.com:your-username/dasara-zone.git`).
3. Link the remote and push:
```bash
# Add your new remote
git remote add origin https://github.com/your-username/your-repo-name.git

# Push your code to the new repository
git push -u origin main
```

---

## 💻 Local Development Setup

To run this application locally on your computer:

### Prerequisites
- Node.js (version 18 or newer recommended, version 22+ supported)
- npm or bun

### Installation
```bash
# Install dependencies
npm install

# Start the development server (runs full-stack Express + Vite)
npm run dev
```

Open your browser at `http://localhost:3000`.

### Production Build
```bash
# Build the client bundle
npm run build

# Start the production server
npm start
```

---

## 📁 Project Structure

```
├── dasara_zone.db       # Embedded SQLite database
├── functions/           # Cloudflare Pages Functions API route handlers
├── migrations/          # SQL database migrations (Cloudflare D1 & SQLite)
├── scripts/             # Utility scripts (ZIP packaging, etc.)
├── src/
│   ├── components/      # React components (Navbar, ParticipationPage, etc.)
│   ├── types.ts         # TypeScript data models
│   ├── api.ts           # Client API layer
│   ├── App.tsx          # Main application container
│   ├── main.tsx         # React entry point
│   └── index.css        # Tailwind CSS and responsive table utilities
├── server.ts            # Node.js Express server + SQLite backend
├── package.json         # Project scripts and dependencies
├── vite.config.ts       # Vite frontend configuration
└── wrangler.toml        # Cloudflare D1 deployment configuration
```

---

## 📄 License
MIT License. Created by Alpha for Dasara Zone.
