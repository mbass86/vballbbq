FROM node:20

WORKDIR /app

# Install dependencies needed for SQLite native compilation if necessary. 
# Slim images usually lack python/build-essential but prebuilt sqlite3 binaries often work.
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
RUN npm rebuild sqlite3 --build-from-source

COPY . .

# Build the Vite React frontend
RUN npm run build

# The data directory where SQLite will live, ensuring it exists
RUN mkdir -p /app/data

# Fly.io expects port 3000 by default but we are using 3001. We will expose it.
EXPOSE 3001

CMD ["npm", "start"]
