# LocalRent Backend

This directory contains the Node.js/Express.js backend for the LocalRent application, using MongoDB as the database.

## Prerequisites

- Node.js (v16 or later recommended)
- npm (comes with Node.js) or yarn
- MongoDB Atlas account or a local MongoDB instance

## Setup

1.  **Clone/Copy Files:** Ensure all files from this `backend` directory are in your project.

2.  **Install Dependencies:**
    Navigate to the `backend` directory in your terminal:
    ```bash
    cd backend
    ```
    Then install the required npm packages:
    ```bash
    npm install express mongoose dotenv bcryptjs jsonwebtoken cors express-validator
    ```
    Or if you use yarn:
    ```bash
    yarn add express mongoose dotenv bcryptjs jsonwebtoken cors express-validator
    ```

3.  **Create Environment File:**
    Create a `.env` file in the `backend` directory. Copy the contents of `.env.example` into it:
    ```
    PORT=5001
    MONGO_URI=mongodb+srv://engkarishpius10:YOUR_DB_PASSWORD@database-test.pyy7lzm.mongodb.net/localrent_db?retryWrites=true&w=majority
    JWT_SECRET=yourSuperSecretJWTKeyForLocalRentApp
    ```
    *   **IMPORTANT:**
        *   Replace `YOUR_DB_PASSWORD` in `MONGO_URI` with your actual MongoDB user password.
        *   Replace `localrent_db` with your desired database name if different.
        *   Change `JWT_SECRET` to a long, random, and secret string.

4.  **Run the Server:**
    ```bash
    npm start
    ```
    Or if you added a dev script (e.g., using nodemon) to `package.json` (see below):
    ```bash
    npm run dev
    ```
    The server should start, typically on `http://localhost:5001`.

## Project Structure

- `server.js`: Main entry point for the Express application.
- `config/`: Database connection configuration.
- `models/`: Mongoose schemas for data entities (User, Property, etc.).
- `routes/`: API route definitions.
- `controllers/`: Logic for handling requests and interacting with models.
- `middleware/`: Custom middleware (e.g., authentication).
- `.env`: Environment variables (ignored by Git).
- `.env.example`: Example environment variables.
- `package.json` & `package-lock.json` (will be generated after `npm install`): Manage project dependencies.

## Basic package.json

You'll need a `package.json` file. If you don't have one in the `backend` directory, run `npm init -y` inside the `backend` directory, then install the dependencies. A minimal `package.json` might look like this after installations:

```json
{
  "name": "localrent-backend",
  "version": "1.0.0",
  "description": "Backend for LocalRent application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0", // Ensure correct version
    "express": "^4.18.0", // Ensure correct version
    "express-validator": "^7.0.0", // Ensure correct version
    "jsonwebtoken": "^9.0.0", // Ensure correct version
    "mongoose": "^8.0.0" // Ensure correct version
  },
  "devDependencies": {
    "nodemon": "^3.0.0" // Ensure correct version
  }
}
```
Install `nodemon` as a dev dependency if you want to use `npm run dev`:
`npm install --save-dev nodemon`

## Next Steps

1.  **Implement All Models:** Complete Mongoose models for Messages and Applications based on `types.ts`.
2.  **Build Out API Endpoints:** Create routes and controllers for all CRUD operations related to properties, messages, and applications.
3.  **Add Validation:** Use `express-validator` for robust input validation on all API endpoints.
4.  **Error Handling:** Implement comprehensive error handling middleware.
5.  **File Uploads:** For property photos, consider using a service like Cloudinary or AWS S3, or GridFS with MongoDB. The current setup expects base64 strings for photos, which is fine for small images but not ideal for larger ones. You'd typically use `multer` for handling `multipart/form-data` uploads.
6.  **Testing:** Write API tests (e.g., using Postman, Insomnia, or automated testing frameworks).
7.  **Frontend Integration:** Update the frontend's `AppContext.tsx` to make `fetch` requests to these backend APIs.

