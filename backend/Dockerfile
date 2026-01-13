FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/main.js"]