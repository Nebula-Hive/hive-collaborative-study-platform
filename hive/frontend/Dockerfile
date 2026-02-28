# FROM localhost:5000/node:20-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 5173
# CMD ["npm", "run", "dev"]


# Stage 1: Build
FROM localhost:5000/node:20-alpine AS build
WORKDIR /app

# Copy package files and install all dependencies for build
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production image
FROM localhost:5000/node:20-alpine
WORKDIR /app

# Install the static file server (serve)
RUN npm install -g serve

# Copy only built files and package files
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./


# Install only production dependencies
RUN npm ci --omit=dev

# Expose port (optional, metadata)
EXPOSE 5173

# Start production server
CMD ["serve", "-s", "dist", "-l", "5173"]