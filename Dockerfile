# Use a light Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json first to leverage Docker cache for dependencies
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose port 5000 (Internal documentation)
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]
