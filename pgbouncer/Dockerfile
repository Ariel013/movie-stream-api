# ─────────────────────────────────────────────────────────────────────────────
# PgBouncer Docker image for HEMOSAFE
# Generates userlist.txt from PostgreSQL at startup rather than storing
# password hashes in the image.
# ─────────────────────────────────────────────────────────────────────────────

FROM alpine:3.20

RUN apk add --no-cache pgbouncer postgresql-client

COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini

# Entrypoint: fetch SCRAM hashes from PostgreSQL and write userlist.txt,
# then start PgBouncer. This ensures hashes are always fresh and never
# baked into the image.
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 5432

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["pgbouncer", "/etc/pgbouncer/pgbouncer.ini"]
