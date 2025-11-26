# Use the official Node.js runtime as the base image
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create a directory for SQLite database
RUN mkdir -p /app/data

# Expose the default port that the HTTP server uses
EXPOSE 8123

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R nodeuser:nodejs /app

# Switch to the non-root user
USER nodeuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8123

# Health check to ensure the server is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD netstat -tln | grep :8123 || exit 1

# Command to run the HTTP server
CMD ["npm", "run", "start:http"]