FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]