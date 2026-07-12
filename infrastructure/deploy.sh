#!/bin/bash
# ============================================================
# AI Resume Analyzer - One-Click Deployment Script
# Usage:
#   First time:  ./deploy.sh --guided
#   Subsequent:  ./deploy.sh
#   Dev env:     ./deploy.sh --env dev
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

STACK_NAME="resume-analyzer"
TEMPLATE_FILE="template.yaml"
FRONTEND_DIR="../"
BUILD_DIR="../dist"

GUIDED=false
ENVIRONMENT="default"

while [[ $# -gt 0 ]]; do
    case $1 in
        --guided) GUIDED=true; shift ;;
        --env) ENVIRONMENT="$2"; shift 2 ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  AI Resume Analyzer - Deployment${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"
command -v sam >/dev/null 2>&1 || { echo -e "${RED}Error: SAM CLI not installed.${NC}"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo -e "${RED}Error: AWS CLI not installed.${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js not installed.${NC}"; exit 1; }
echo -e "${GREEN}  ✓ All prerequisites met${NC}"

# Validate template
echo -e "${YELLOW}[2/6] Validating SAM template...${NC}"
sam validate --template-file "$TEMPLATE_FILE" --lint
echo -e "${GREEN}  ✓ Template is valid${NC}"

# Build
echo -e "${YELLOW}[3/6] Building SAM application...${NC}"
sam build --template-file "$TEMPLATE_FILE" --cached --parallel
echo -e "${GREEN}  ✓ Build complete${NC}"

# Deploy
echo -e "${YELLOW}[4/6] Deploying to AWS...${NC}"
if [ "$GUIDED" = true ]; then
    sam deploy --guided
else
    sam deploy --config-env "$ENVIRONMENT" --no-fail-on-empty-changeset
fi
echo -e "${GREEN}  ✓ Infrastructure deployed${NC}"

# Get stack outputs
echo -e "${YELLOW}[5/6] Building frontend...${NC}"
REGION=$(aws configure get region || echo "us-east-1")
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucketName'].OutputValue" --output text --region "$REGION")
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text --region "$REGION")
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text --region "$REGION")
COGNITO_POOL_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" --output text --region "$REGION")
COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='CognitoClientId'].OutputValue" --output text --region "$REGION")
API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text --region "$REGION")

# Generate .env.production for frontend
cat > "${FRONTEND_DIR}/.env.production" <<EOF
VITE_COGNITO_USER_POOL_ID=${COGNITO_POOL_ID}
VITE_COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
VITE_API_ENDPOINT=${API_URL}
VITE_AWS_REGION=${REGION}
EOF

cd "$FRONTEND_DIR"
npm ci --production=false
npm run build
cd - > /dev/null
echo -e "${GREEN}  ✓ Frontend built${NC}"

# Upload to S3 and invalidate CloudFront
echo -e "${YELLOW}[6/6] Uploading to S3 & invalidating CloudFront...${NC}"
aws s3 sync "$BUILD_DIR" "s3://${BUCKET_NAME}" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "*.json" \
    --region "$REGION"

aws s3 cp "${BUILD_DIR}/index.html" "s3://${BUCKET_NAME}/index.html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html" \
    --region "$REGION"

aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --region "$REGION" > /dev/null

echo -e "${GREEN}  ✓ Frontend deployed${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✓ Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${BLUE}Frontend URL:${NC}    ${CLOUDFRONT_URL}"
echo -e "  ${BLUE}API Endpoint:${NC}    ${API_URL}"
echo -e "  ${BLUE}Cognito Pool:${NC}    ${COGNITO_POOL_ID}"
echo -e "  ${BLUE}Cognito Client:${NC}  ${COGNITO_CLIENT_ID}"
echo -e "  ${BLUE}S3 Bucket:${NC}       ${BUCKET_NAME}"
echo ""
echo -e "${YELLOW}Note: CloudFront may take 5-10 minutes to propagate.${NC}"
