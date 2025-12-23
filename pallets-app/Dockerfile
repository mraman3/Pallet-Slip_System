# -------- Base image --------
FROM node:22-slim

# -------- Install Chrome dependencies --------
RUN apt-get update && apt-get install -y \
  wget \
  gnupg \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# -------- Install Google Chrome --------
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub \
  | gpg --dearmor > /etc/apt/trusted.gpg.d/google.gpg \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
  > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# -------- App directory --------
WORKDIR /app

# -------- Install deps first (cache-friendly) --------
COPY package.json package-lock.json ./
RUN npm install --include=dev

# -------- Copy source --------
COPY . .

# -------- Prisma + build --------
RUN npx prisma generate && npm run build

# -------- Puppeteer config --------
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# -------- Expose app --------
EXPOSE 4000

# -------- Start server --------
CMD ["node", "dist/index.js"]
