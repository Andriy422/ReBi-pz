FROM node:20-alpine
WORKDIR /app
RUN npm init -y && npm install express
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]