FROM node:18-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Stage 1: Dependencies
FROM base AS dependencies
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @myhotelflow/web...

# Stage 2: Build
FROM base AS build
WORKDIR /app

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules

# Copy source
COPY turbo.json ./
COPY apps/web ./apps/web

# Build args
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build
RUN pnpm --filter @myhotelflow/web build

# Stage 3: Production with nginx
FROM nginx:alpine AS production

COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
