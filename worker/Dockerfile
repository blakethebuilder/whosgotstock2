FROM node:20-alpine
WORKDIR /app

# Copy dependency files from the worker subfolder
COPY worker/package*.json ./
RUN npm install --production

# Copy all worker source files into the current /app directory
COPY worker/ .

CMD ["node", "index.js"]
