#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
ENV_FILE="$SCRIPT_DIR/../.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI not found. Install it, then re-run this script."
  echo "macOS: brew install awscli"
  echo "Linux: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1
fi

ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
REGION=${AWS_REGION:-us-east-1}
TABLE_NAME=${DYNAMODB_TABLE_NAME:-incidents}

export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-test}
export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-test}

aws --endpoint-url="$ENDPOINT_URL" dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  >/dev/null || true

echo "LocalStack resources ready."
