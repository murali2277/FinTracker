# 🐳 How to Build & Push to Docker Hub

Since you are deploying the **Backend** to Render (which supports Docker) and the **Frontend** to Netlify (which hosts static files), you typically only need to worry about the Backend Docker image.

However, below are the instructions for building and pushing the Backend image.

## Prerequisites

1.  **Install Docker Desktop**: Download from [docker.com](https://www.docker.com/products/docker-desktop/).
2.  **Docker Hub Account**: Create one at [hub.docker.com](https://hub.docker.com/).
3.  **Login**: Open your terminal and log in:
    ```powershell
    docker login
    ```

## 1. Backend Image (Node.js API)

This is the image you will identify on Render.

### Step A: Navigate to Server Directory
You must run these commands from the `server` folder where the `Dockerfile` is located.
```powershell
cd server
```

### Step B: Build the Image
Replace `your-username` with your actual Docker Hub username.
```powershell
# Format: docker build -t <hub-username>/<image-name>:<tag> .
docker build -t your-username/fintracker-api:latest .
```

### Step C: Test Locally (Optional)
Run it to make sure it works before pushing.
```powershell
docker run -p 5000:5000 --env-file .env your-username/fintracker-api:latest
```
*(Note: You need a `.env` file in the server directory for this to work locally)*

### Step D: Push to Docker Hub
```powershell
docker push your-username/fintracker-api:latest
```

---

## 2. Frontend (Clarification)

**Note for Netlify**: You do **NOT** need to push a Docker image for the Frontend to deploy on Netlify. Netlify builds your code directly from GitHub.

**If you STILL want to Dockerize the Frontend** (e.g., to run it on Render or AWS instead), create a file named `Dockerfile` in the **root** folder with this content:

```dockerfile
# Root Dockerfile for Frontend (Optional)
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Then build and push it like the backend:
```powershell
# From root directory
docker build -t your-username/fintracker-web:latest .
docker push your-username/fintracker-web:latest
```
