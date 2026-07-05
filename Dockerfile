FROM node:20-alpine AS builder
WORKDIR /build

COPY modules/proto/ ./proto/
COPY modules/shared/ ./shared/

COPY modules/user/package*.json ./user/
RUN cd user && npm install --no-audit --no-fund

COPY modules/user/ ./user/
RUN cd user && npm run build

FROM node:20-alpine
WORKDIR /app

COPY modules/user/package*.json ./user/
RUN cd user && npm install --omit=dev --no-audit --no-fund

COPY --from=builder /build/user/dist ./user/dist
# __dirname = /app/user/dist/user/src → ../../proto/ = /app/user/dist/proto/
COPY --from=builder /build/proto ./user/dist/proto

WORKDIR /app/user
EXPOSE 4006
CMD ["node", "dist/user/src/main.js"]
