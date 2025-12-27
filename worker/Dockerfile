FROM node:20-alpine
WORKDIR /app

# Install Puppeteer dependencies for Alpine Linux
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip installing Chromium. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy dependency files from the worker subfolder
COPY worker/package*.json ./
RUN npm install --production

# Copy all worker source files into the current /app directory
COPY worker/ .

CMD ["node", "index.js"]
