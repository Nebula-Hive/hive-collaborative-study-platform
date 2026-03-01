FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 10 && \
    npm config set strict-ssl false && \
    npm ci --force --network-concurrency 1
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
