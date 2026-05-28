FROM node:18-bullseye

# Install Java (JRE) and required tools
RUN apt-get update && apt-get install -y default-jre wget tar && rm -rf /var/lib/apt/lists/*

# Download and extract PRISM Model Checker (Linux x64)
WORKDIR /opt
RUN wget https://github.com/prismmodelchecker/prism/releases/download/v4.8.1/prism-4.8.1-linux64-x86.tar.gz && \
    tar -xzf prism-4.8.1-linux64-x86.tar.gz && \
    mv prism-4.8.1-linux64-x86 prism && \
    rm prism-4.8.1-linux64-x86.tar.gz && \
    cd prism && ./install.sh

# Setup Node.js Application
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for Vite build)
RUN npm install

# Copy application source code
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Start the Node.js server
CMD ["node", "server.js"]
