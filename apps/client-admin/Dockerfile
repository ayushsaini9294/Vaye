# Base image for building
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root monorepo files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/db-schema/package.json ./packages/db-schema/
COPY packages/proto/package.json ./packages/proto/
COPY packages/grpc-client/package.json ./packages/grpc-client/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/ui/package.json ./packages/ui/
COPY apps/client-admin/package.json ./apps/client-admin/
COPY tooling/typescript/package.json ./tooling/typescript/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN pnpm run build --filter=@vaye/client-admin...

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy necessary files from builder
COPY --from=base /app/apps/client-admin/.output /app/apps/client-admin/.output
COPY --from=base /app/apps/client-admin/package.json /app/apps/client-admin/package.json
COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json ./
COPY --from=base /app/node_modules /app/node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

WORKDIR /app/apps/client-admin

CMD ["pnpm", "start"]
