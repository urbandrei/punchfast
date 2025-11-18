# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source code
COPY client/ ./

# Build the React application
RUN npm run build

# Stage 2: Setup Node.js Backend
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY server/package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend source code
COPY server/ ./

# Copy built frontend from stage 1
COPY --from=frontend-build /app/client/build ./public

# Expose port 5000
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]
