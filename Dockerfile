ARG APP_VERSION="v0.0.0+unknown"
FROM node:21-alpine as build-stage
WORKDIR /app
COPY package*.json /app/

RUN npm ci --quiet
COPY . /app/
ARG configuration=production
RUN npx nx run-many -t build -p backend frontend
RUN mv /app/dist/apps/frontend /app/dist/apps/backend/assets

FROM node:21-alpine AS express-js
RUN apk add --no-cache bash
WORKDIR /app
COPY --from=build-stage /app/dist/apps/backend .
COPY --from=build-stage /app/apps/backend/prisma .
COPY --from=build-stage /app/docker-entrypoint.sh .

RUN npx prisma generate \
  # Prune non-used files
  && npm prune --production \
  # Clean Prisma non-used files https://github.com/prisma/prisma/issues/11577
  && rm -rf node_modules/.cache/ \
  # Remove cache
  && rm -rf /root/.cache/ \
  && rm -rf /root/.npm/

ENV NODE_ENV production
ENV PORT 4000
ENV DATABASE_URL file:/var/db/sqlite.db
ENV ASSETS_DIR /app/assets

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["start"]
