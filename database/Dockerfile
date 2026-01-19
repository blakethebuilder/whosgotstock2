# Dockerfile for database migrations
FROM postgres:15-alpine

# Install bash for running scripts
RUN apk add --no-cache bash

# Copy migration scripts
COPY run-migrations.sh /migrations/run-migrations.sh
COPY init.sql /migrations/init.sql
COPY migrate-suppliers.sql /migrations/migrate-suppliers.sql
COPY migrations/ /migrations/migrations/

# Make scripts executable
RUN chmod +x /migrations/run-migrations.sh

WORKDIR /migrations

CMD ["bash"]