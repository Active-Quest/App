# Use Node.js base image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all backend files
COPY . .

# Expose the port your app runs on
EXPOSE 3002

# Start the app using the entrypoint
CMD ["node", "bin/www"]
