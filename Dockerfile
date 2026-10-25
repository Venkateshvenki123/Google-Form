# Multi-stage Docker build for FormCraft Pro
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN npm install --prefix server
RUN npm install --prefix client

# Copy source code
COPY . .

# Build client and server
RUN npm run build --prefix client
RUN npm run build --prefix server

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root and server packages
COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm install --omit=dev --prefix server

# Copy built artifacts from builder stage
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Create uploads and data directories
RUN mkdir -p /app/server/uploads /app/server/data

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
