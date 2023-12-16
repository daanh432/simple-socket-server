# Use an official Node.js runtime as the base image
FROM node:20 as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build

# Remove development dependencies
RUN npm prune --production

FROM node:20

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose the port your application will run on
EXPOSE 3000

# Define the command to run your application
CMD ["node", "dist/main.js"]
