FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3006
CMD ["node", "server.js"]
