FROM node:18-alpine AS base

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code to the working directory
COPY . .

# Build the Next.js application
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy the built application from the builder stage
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

# Set the correct permission for prerender cache
RUN mkdir -p .next/cache
RUN chown -R node:node .next/cache

USER node

EXPOSE 3000

ENV PORT 3000

# Use the Next.js start command to start the server
CMD ["npm", "start"]
