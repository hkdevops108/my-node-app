# Use a specific Node version, not "latest" — reproducibility matters in real pipelines
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy only package files first — this leverages Docker layer caching.
# Dependencies only get reinstalled if package*.json changes, not on every code change.
COPY package*.json ./

RUN npm ci --only=production

# Now copy the rest of the app code
COPY . .

# Document the port the app listens on (informational, doesn't actually publish it)
EXPOSE 3000

# Run as a non-root user — a real security best practice interviewers may ask about
USER node

CMD ["node", "server.js"]
