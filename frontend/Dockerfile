FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["npx", "pnpm", "start"]
