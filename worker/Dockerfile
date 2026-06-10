FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy dependency files from the worker subfolder
COPY worker/package*.json ./
RUN npm install --production

# Copy all worker source files into the current /app directory
COPY worker/ .

CMD ["node", "index.js"]
