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
COPY apps/client-user/package.json ./apps/client-user/
COPY tooling/typescript/package.json ./tooling/typescript/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN pnpm run build --filter=@vaye/client-user...

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy necessary files from builder
COPY --from=base /app/apps/client-user/.output /app/apps/client-user/.output
COPY --from=base /app/apps/client-user/package.json /app/apps/client-user/package.json
COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json ./
COPY --from=base /app/node_modules /app/node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

WORKDIR /app/apps/client-user

CMD ["pnpm", "start"]
