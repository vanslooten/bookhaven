FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the client
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Define environment variable
ENV NODE_ENV production

# Command to run the application
CMD ["node", "server/index.js"]