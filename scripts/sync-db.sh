#!/usr/bin/env bash
# sync-db.sh — sync between local and production RDS (direct connection)
#
# Usage:
#   ./scripts/sync-db.sh pull   # prod → local
#   ./scripts/sync-db.sh push   # local → prod

set -euo pipefail

DIRECTION="${1:-}"
STACK_NAME="WuwaRotationBuilderStack"
LOCAL_DB="postgres://localhost:5432/wuwa_rotation_builder"

if [[ "$DIRECTION" != "pull" && "$DIRECTION" != "push" ]]; then
  echo "Usage: $0 <pull|push>"
  echo "  pull   — copy prod → local"
  echo "  push   — copy local → prod"
  exit 1
fi

echo "Fetching RDS endpoint..."
RDS_HOST=$(aws rds describe-db-instances \
  --query 'DBInstances[?DBName==`wuwa_rotation_builder`].Endpoint.Address' \
  --output text)

if [[ -z "$RDS_HOST" ]]; then
  echo "Error: could not find RDS instance for database 'wuwa_rotation_builder'" >&2
  exit 1
fi

echo "Fetching credentials from Secrets Manager..."
SECRET_ARN=$(aws cloudformation describe-stack-resources \
  --stack-name "$STACK_NAME" \
  --query 'StackResources[?ResourceType==`AWS::SecretsManager::Secret`].PhysicalResourceId' \
  --output text | head -n1)

SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ARN" \
  --query SecretString \
  --output text)

RDS_PASSWORD=$(echo "$SECRET_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['password'])")
RDS_USER="postgres"
RDS_DB="wuwa_rotation_builder"
DUMP_FILE="/tmp/wuwa_db_sync.sql"

# Strip settings unsupported by older PG versions (e.g. transaction_timeout added in PG17)
strip_compat() {
  grep -v "transaction_timeout"
}

export PGPASSWORD="$RDS_PASSWORD"

case "$DIRECTION" in
  pull)
    echo "Dumping prod ($RDS_HOST) → $DUMP_FILE ..."
    pg_dump -h "$RDS_HOST" -p 5432 -U "$RDS_USER" -d "$RDS_DB" \
      --format=plain --no-owner --no-acl | strip_compat > "$DUMP_FILE"

    echo "Restoring to local..."
    psql "$LOCAL_DB" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$RDS_DB' AND pid <> pg_backend_pid();" 2>/dev/null || true
    dropdb --if-exists wuwa_rotation_builder
    createdb wuwa_rotation_builder
    psql "$LOCAL_DB" -f "$DUMP_FILE"

    echo "Done. Local DB is now a copy of prod."
    ;;

  push)
    echo "This will OVERWRITE prod with your local database."
    read -r -p "Are you sure? [y/N] " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      echo "Aborted."
      exit 0
    fi

    echo "Dumping local → $DUMP_FILE ..."
    pg_dump "$LOCAL_DB" --format=plain --no-owner --no-acl | strip_compat > "$DUMP_FILE"

    echo "Restoring to prod ($RDS_HOST)..."
    psql -h "$RDS_HOST" -p 5432 -U "$RDS_USER" -d postgres \
      -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$RDS_DB' AND pid <> pg_backend_pid();"
    dropdb -h "$RDS_HOST" -p 5432 -U "$RDS_USER" --if-exists "$RDS_DB"
    createdb -h "$RDS_HOST" -p 5432 -U "$RDS_USER" "$RDS_DB"
    psql -h "$RDS_HOST" -p 5432 -U "$RDS_USER" -d "$RDS_DB" -f "$DUMP_FILE"

    echo "Done. Prod DB is now a copy of local."
    ;;
esac

unset PGPASSWORD
rm -f "$DUMP_FILE"
