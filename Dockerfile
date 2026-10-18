FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:20-alpine
COPY ./package.json package-lock.json /app/
# Install ALL deps so tsx (a devDependency) is available at runtime
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
# Copy the TypeScript entry point and server source
COPY ./server.ts /app/server.ts
COPY ./server /app/server
COPY ./tsconfig.json /app/tsconfig.json
WORKDIR /app
CMD ["npm", "run", "start"]