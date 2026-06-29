FROM node:20-bookworm

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Install Playwright Chromium and all its required Linux system dependencies
RUN npx playwright install chromium --with-deps

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port Railway expects
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
