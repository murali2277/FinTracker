---
description: Deployment Guide for FinTracker
---
# 🚀 Deployment Guide: FinTracker

This guide explains how to deploy the **Frontend to Netlify** and the **Backend to Render**.

## 1. Preparation (GitHub)

1.  Make sure your project is pushed to a **GitHub repository**.
2.  Ensure you have the following folder structure:
    *   `/` (Root) -> Frontend Code
    *   `/server` -> Backend Code

## 2. Deploy Backend (Render)

We will deploy the backend first to get the API URL.

1.  Log in to [Render.com](https://render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  **Configuration**:
    *   **Name**: `fintracker-api`
    *   **Language/Runtime**: `Node` (as shown in your screenshot)
    *   **Root Directory**: `server` (Important!)
    *   **Build Command**: `npm install` (Do NOT use `npm run build` as there is no build step for the backend)
    *   **Start Command**: `node index.js`
5.  **Environment Variables** (Add these in the Render dashboard):
    *   `MONGODB_URI`: Your MongoDB Connection String (e.g., from MongoDB Atlas)
        *   *Note: Using `localhost` won't work in the cloud. You must use a cloud database like MongoDB Atlas.*
    *   `JWT_SECRET`: A secure secret string for authentication.
    *   `NODE_ENV`: `production`
6.  Click **Create Web Service**.
7.  Wait for deployment. Once ready, copy the **Service URL** (e.g., `https://fintracker-api.onrender.com`).

## 3. Deploy Frontend (Netlify)

1.  Log in to [Netlify](https://www.netlify.com/).
2.  Click **Add new site** -> **Import from Git**.
3.  Connect your GitHub repository.
4.  **Build Settings**:
    *   Netlify will detect the `netlify.toml` file we created and auto-configure:
    *   **Build Command**: `npm run build`
    *   **Publish Directory**: `dist`
5.  **Environment Variables**:
    *   Click **Add environment variable**.
    *   Key: `VITE_API_URL`
    *   Value: `https://fintracker-api.onrender.com/api` (Use the URL from Render, append `/api` if your frontend expects it, or just the base URL depending on your axios config).
        *   *Check `src/context/AuthContext.jsx` or your axios setup. If you hardcoded localhost, you need to update it to use `import.meta.env.VITE_API_URL`.*
6.  Click **Deploy site**.

## 4. Final Application Check

1.  Update your Frontend Code (if needed):
    Ensure your axios calls use the environment variable.
    Example: `axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';`
2.  Push changes to GitHub. Netlify will auto-redeploy.
3.  Open your Netlify URL and test the login/register flow!

---
**Troubleshooting**:
*   **CORS Error**: If the frontend can't talk to the backend, go to `server/index.js` and ensure `cors` is configured to accept your Netlify domain.
    ```javascript
    app.use(cors({
      origin: ['http://localhost:5173', 'https://your-netlify-site.netlify.app']
    }));
    ```
