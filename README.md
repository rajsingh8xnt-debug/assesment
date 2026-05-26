# DeskFlow — A Support Ticket Triage Board

DeskFlow is a modern support ticket triage board designed on the MERN stack. It enables support agents to seamlessly manage customer tickets, track priority-based SLAs, validate inputs, enforce adjacent status-transitions, and dynamically modify statuses with standard HTML5 drag-and-drop mechanics or quick-action transition triggers.

## 🚀 Key Features

- **Dynamic SLA Management**: Calculates elapsed duration (`ageMinutes`) and breaches (`slaBreached`) on every read query dynamically relative to status and priority:
  - `urgent`: 1 hour
  - `high`: 4 hours
  - `medium`: 24 hours
  - `low`: 72 hours
- **Strict Status Progression Rules**: API and UI enforce adjacent status flows only: `Open` $\leftrightarrow$ `In Progress` $\leftrightarrow$ `Resolved` $\leftrightarrow$ `Closed`.
- **Drag-and-Drop Column Adjustments**: Standard HTML5 drag and drop zones. Disallowed transitions snap back instantly with visual card-shake errors.
- **Glowing glassmorphic UI**: Vibrant indicators, custom scrollbars, toast alert popups, and dark mode theme.
- **Built-in Fallback Database**: Connected dynamically to MongoDB Atlas, with an automatic memory server fallback for local zero-configuration review.

---

## 🛠️ Tech Stack

* **Backend**: Node.js, Express, Mongoose, MongoDB
* **Frontend**: React, Vite, Vanilla CSS, Lucide Icons

---

## 🏁 Local Development Setup

We recommend setting the workspace to the project directory:
* Project root: `/deskflow`

### 1. Run the Backend Server:
1. Open a terminal inside `backend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update `backend/.env` with your Mongo connection URI. *(If omitted, it will automatically spawn an in-memory MongoMemoryServer database for fallback!)*
4. Launch the server:
   ```bash
   npm run dev
   ```
   Server will start on `http://localhost:5000`

### 2. Run the Frontend Client:
1. Open a terminal inside `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite client:
   ```bash
   npm run dev
   ```
4. Access the web interface at **`http://localhost:3000`**

### 3. Run Backend Business Logic Tests:
1. Inside `backend/` terminal, run:
   ```bash
   node test-backend.js
   ```
