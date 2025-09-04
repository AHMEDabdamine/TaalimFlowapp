# ---------- Build stage ----------
    FROM node:22-alpine as build

    WORKDIR /app
    
    # Copy package files and install ALL deps (including dev)
    COPY package*.json ./
    RUN npm install
    
    # Copy the rest of the code
    COPY . .
    
    # Build frontend and backend
    RUN npm run build
    
    # ---------- Production stage ----------
    FROM node:22-alpine
    
    WORKDIR /app
    
    # Copy package files and install ONLY production deps
    COPY package*.json ./
    RUN npm install --omit=dev
    
    # Copy built output from build stage
    COPY --from=build /app/dist ./dist
    
    # Expose port
    EXPOSE 5000
    
    # Start server
    CMD ["node", "dist/server/index.js"]
    