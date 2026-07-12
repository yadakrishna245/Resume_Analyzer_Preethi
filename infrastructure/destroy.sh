#!/bin/bash
# ============================================================
# AI Resume Analyzer - Cleanup/Destroy Script
# WARNING: This will permanently delete all resources!
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

STACK_NAME="resume-analyzer"

echo -e "${RED}============================================${NC}"
echo -e "${RED}  ⚠️  DESTROY ALL RESOURCES${NC}"
echo -e "${RED}============================================${NC}"
echo ""
echo -e "${YELLOW}This will permanently delete:${NC}"
echo "  - S3 bucket and all files"
echo "  - CloudFront distribution"
echo "  - Cognito User Pool (all users!)"
echo "  - DynamoDB table (all data!)"
echo "  - API Gateway"
echo "  - Lambda functions"
echo "  - All associated IAM roles"
echo ""
read -p "Are you sure? Type 'destroy' to confirm: " CONFIRM

if [ "$CONFIRM" != "destroy" ]; then
    echo -e "${GREEN}Cancelled. No resources were deleted.${NC}"
    exit 0
fi

REGION=$(aws configure get region || echo "us-east-1")

# Step 1: Get bucket name from stack outputs
echo -e "${YELLOW}[1/4] Getting resource information...${NC}"
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucketName'].OutputValue" \
    --output text \
    --region "$REGION" 2>/dev/null || echo "")

# Step 2: Empty S3 bucket (required before deletion)
if [ -n "$BUCKET_NAME" ] && [ "$BUCKET_NAME" != "None" ]; then
    echo -e "${YELLOW}[2/4] Emptying S3 bucket: ${BUCKET_NAME}...${NC}"
    aws s3 rm "s3://${BUCKET_NAME}" --recursive --region "$REGION" 2>/dev/null || true
    # Also delete versioned objects
    aws s3api list-object-versions \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --query 'Versions[].{Key:Key,VersionId:VersionId}' \
        --output json 2>/dev/null | \
    python3 -c "
import sys, json
try:
    versions = json.load(sys.stdin)
    if versions:
        for v in versions:
            print(f\"{v['Key']} {v['VersionId']}\")
except:
    pass
" 2>/dev/null | while read -r key version; do
        aws s3api delete-object --bucket "$BUCKET_NAME" --key "$key" --version-id "$version" --region "$REGION" 2>/dev/null || true
    done
    # Delete markers too
    aws s3api list-object-versions \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' \
        --output json 2>/dev/null | \
    python3 -c "
import sys, json
try:
    markers = json.load(sys.stdin)
    if markers:
        for m in markers:
            print(f\"{m['Key']} {m['VersionId']}\")
except:
    pass
" 2>/dev/null | while read -r key version; do
        aws s3api delete-object --bucket "$BUCKET_NAME" --key "$key" --version-id "$version" --region "$REGION" 2>/dev/null || true
    done
    echo -e "${GREEN}  ✓ Bucket emptied${NC}"
else
    echo -e "${YELLOW}[2/4] No bucket found, skipping...${NC}"
fi

# Step 3: Disable Cognito deletion protection
echo -e "${YELLOW}[3/4] Disabling deletion protection on Cognito...${NC}"
POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" \
    --output text \
    --region "$REGION" 2>/dev/null || echo "")

if [ -n "$POOL_ID" ] && [ "$POOL_ID" != "None" ]; then
    aws cognito-idp update-user-pool \
        --user-pool-id "$POOL_ID" \
        --deletion-protection INACTIVE \
        --region "$REGION" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Deletion protection disabled${NC}"
fi

# Step 4: Delete the CloudFormation stack
echo -e "${YELLOW}[4/4] Deleting CloudFormation stack...${NC}"
sam delete \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --no-prompts

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✓ All resources destroyed${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Note: CloudFront distributions may take 15-20 minutes to fully delete.${NC}"
