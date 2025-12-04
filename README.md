# 🐝 Hive Keyword Tracker

A powerful, real-time search tool for the [Hive Blockchain](https://hive.io). This application allows users to monitor specific keywords across all Hive posts created in the last 3 days using a direct SQL connection to a HAF (Hive Application Framework) node.

## ✨ Features

- **Real-time HAF SQL**: Queries the blockchain state directly for instant results.
- **Smart Keyword Monitoring**: Track up to 10 keywords simultaneously.
- **Time Window**: Automatically scans the last 72 hours (3 days) of blockchain activity.
- **Rich Post Previews**:
  - Extracts and displays the first image from Markdown or HTML.
  - Highlights keyword context in snippets.
  - Shows author, date, and category/tags.
- **Platform Choice**: Open posts directly in your favorite interface:
  - PeakD
  - Ecency
  - Hive.blog
- **Theme System**: Built-in Dark Mode and Light Mode with persistence.
- **Local Persistence**: Remembers your keywords, platform preference, and theme settings.
- **Debug Console**: View the exact SQL queries generated and execution logs.

## 🏗 Architecture

Since web browsers cannot connect directly to PostgreSQL databases (due to security protocols), this project uses a lightweight **Node.js Middleware** architecture:

1.  **Frontend (React + Vite)**: User interface and settings.
2.  **Middleware (Express)**: Receives requests from the frontend, securely connects to the HAF SQL database, and returns sanitized JSON data.
3.  **Database (HAF SQL)**: The public Hive Application Framework node (provided by Mahdiyari).

## 🚀 Getting Started (Local Development)

To run this project locally, you need to run both the **Backend** (Middleware) and the **Frontend** (React).

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Server
Open your first terminal window and run:
```bash
node server.js
```
*This starts the middleware on `http://localhost:3000`.*

### 3. Start the Frontend
Open a **second** terminal window and run:
```bash
npm run dev
```
*This starts the UI (usually on `http://localhost:5173`).*

### 4. Configure Connection
1.  Open the App in your browser.
2.  Go to **Settings**.
3.  Ensure **Middleware URL** is set to: `http://localhost:3000/search`.

---

## ☁️ Deployment (Render.com)

This project is optimized for deployment on [Render](https://render.com) as a "Web Service".

### Build Command
Render needs to build the frontend and install backend dependencies:
```bash
npm install && npm run build
```

### Start Command
Render needs to start the Node.js server (which serves the built frontend):
```bash
node server.js
```

### Environment Variables
No manual environment variables are required. The application automatically detects:
1.  The `PORT` provided by Render.
2.  The environment (Production vs. Local) to adjust the API endpoint automatically to `/search` (relative path).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express.js, `pg` (PostgreSQL client)
- **Database**: HAF (Hive Application Framework) PostgreSQL
- **Tooling**: Vite

## ⚠️ Troubleshooting

**"Failed to fetch" / Connection Error**
1.  **Local**: Ensure `node server.js` is running in a separate terminal. Check your Settings > Middleware URL is `http://localhost:3000/search`.
2.  **Production**: Check the deployment logs. Ensure the build command successfully created the `dist/` folder.

**Database Errors (Status 500)**
- Check the **Debug** console at the bottom of the app.
- If the HAF node is down or the query times out, the error details will appear there.

## ❤️ Credits

- **Creator**: [@louis88](https://peakd.com/@louis88)
- **HAF Node**: Public endpoint provided by Mahdiyari.

---
*Support the Hive ecosystem by voting for **louis.witness**.*
