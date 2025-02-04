# build the backend
FROM golang:1.23-alpine AS backend-builder

# set the workdir
WORKDIR /usr/src/backend

# install the dependencies
COPY backend/go.mod backend/go.sum ./
RUN go mod download && go mod verify

# build the source-code
COPY backend .
RUN go build -ldflags "-s -w" -o dist/golunteer

# build the frontend
FROM node:current AS client-builder

WORKDIR /usr/src/client

COPY client/package*.json ./
RUN npm ci

COPY client .

RUN npm run build

FROM alpine:latest

WORKDIR /usr/bin/app

# copy the backend
COPY --from=backend-builder /usr/src/backend/dist/golunteer golunteer
COPY backend/setup.sql backend/tables.sql ./

# copy the client-html
COPY --from=client-builder /usr/src/client/out html

EXPOSE 80

# Create a group and user
RUN addgroup -S golunteer && adduser -S golunteer -G golunteer

# create an empty config-file so that a bind doesn't create a directory
RUN touch config.yaml && chown -R golunteer:golunteer config.yaml
RUN mkdir data && chown -R golunteer:golunteer data
RUN mkdir logs && chown -R golunteer:golunteer logs

# copy the config-file
COPY backend/config-default.yaml .

# Tell docker that all future commands should run as the appuser user
USER golunteer

# run the app
CMD ["./golunteer", "data/config.yaml"]