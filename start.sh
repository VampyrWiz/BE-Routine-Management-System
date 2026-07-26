#!/bin/bash
echo "Starting BE Routine Management System..."
echo ""

echo "Building and starting containers..."
docker-compose up -d --build

echo ""
echo "Waiting for MongoDB to be ready..."
sleep 5

echo "Seeding database..."
docker-compose run --rm seed

echo "Start..."
docker-compose up