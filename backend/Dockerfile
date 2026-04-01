# Use Node.js 20 runtime
FROM node:20-bookworm

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
ENV PORT=3001
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
