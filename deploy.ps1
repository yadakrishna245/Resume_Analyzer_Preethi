#Requires -Version 5.1
<#
.SYNOPSIS
    NexuCV AI Resume Analyzer - One-Click AWS Deployment Script
.DESCRIPTION
    Deploys the entire NexuCV AI Resume Analyzer stack to AWS using SAM CLI.
    Includes: API Gateway, Lambda, DynamoDB, Cognito, S3, CloudFront
.PARAMETER Destroy
    Tears down the entire stack and removes all resources
.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -Destroy
.NOTES
    Author: NexuCV Team
    Requires: AWS CLI, SAM CLI, Node.js 18+, npm, git
#>

param(
    [switch]$Destroy
)

# ============================================================================
# CONFIGURATION
# ============================================================================
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$STACK_NAME_PREFIX = "nexucv-resume-analyzer"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $SCRIPT_DIR

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Banner {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║                                                              ║" -ForegroundColor Cyan
    Write-Host "  ║          NexuCV AI Resume Analyzer - Deployment              ║" -ForegroundColor Cyan
    Write-Host "  ║                    One-Click AWS Deploy                       ║" -ForegroundColor Cyan
    Write-Host "  ║                                                              ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$StepNum, [string]$Message)
    Write-Host ""
    Write-Host "  [$StepNum]" -ForegroundColor Yellow -NoNewline
    Write-Host " $Message" -ForegroundColor White
    Write-Host "  $('─' * 60)" -ForegroundColor DarkGray
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ $Message" -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host "  ⚠ $Message" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "  ✗ $Message" -ForegroundColor Red
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Get-StackOutput {
    param([string]$StackName, [string]$OutputKey, [string]$Region)
    $outputs = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs[?OutputKey=='$OutputKey'].OutputValue" --output text 2>$null
    return $outputs
}

function Test-StackExists {
    param([string]$StackName, [string]$Region)
    try {
        $status = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].StackStatus" --output text 2>$null
        if ($LASTEXITCODE -eq 0 -and $status) {
            return $true
        }
        return $false
    } catch {
        return $false
    }
}



# ============================================================================
# DESTROY MODE - Tear down everything
# ============================================================================
if ($Destroy) {
    Write-Banner
    Write-Host "  ⚠  DESTROY MODE - This will remove ALL deployed resources!" -ForegroundColor Red
    Write-Host ""
    
    $region = Read-Host "  Enter AWS Region (default: us-east-1)"
    if ([string]::IsNullOrWhiteSpace($region)) { $region = "us-east-1" }
    
    $env_name = Read-Host "  Enter Environment (dev/staging/prod, default: prod)"
    if ([string]::IsNullOrWhiteSpace($env_name)) { $env_name = "prod" }
    
    $stackName = "$STACK_NAME_PREFIX-$env_name"
    
    Write-Host ""
    Write-Host "  Stack to destroy: " -NoNewline
    Write-Host "$stackName" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "  Type 'DESTROY' to confirm"
    
    if ($confirm -ne 'DESTROY') {
        Write-Warn "Aborted. No resources were deleted."
        exit 0
    }
    
    try {
        # Empty the S3 bucket first
        Write-Info "Emptying S3 bucket..."
        $bucketName = Get-StackOutput -StackName $stackName -OutputKey "FrontendBucketName" -Region $region
        if ($bucketName) {
            aws s3 rm "s3://$bucketName" --recursive --region $region 2>$null
            Write-Success "S3 bucket emptied"
        }
        
        # Delete the CloudFormation stack
        Write-Info "Deleting CloudFormation stack: $stackName..."
        aws cloudformation delete-stack --stack-name $stackName --region $region
        Write-Info "Waiting for stack deletion (this may take 5-10 minutes)..."
        aws cloudformation wait stack-delete-complete --stack-name $stackName --region $region
        Write-Success "Stack '$stackName' has been completely destroyed!"
        
        # Clean up local files
        if (Test-Path "deployment-output.json") { Remove-Item "deployment-output.json" -Force }
        if (Test-Path ".env.production") { Remove-Item ".env.production" -Force }
        Write-Success "Local deployment files cleaned up"
        
    } catch {
        Write-Err "Failed to destroy stack: $_"
        Write-Warn "You may need to manually delete resources in the AWS Console."
        exit 1
    }
    
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "  ║          All resources have been destroyed!                  ║" -ForegroundColor Green
    Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    exit 0
}

# ============================================================================
# MAIN DEPLOYMENT FLOW
# ============================================================================

Write-Banner
$deployStart = Get-Date

# --------------------------------------------------------------------------
# STEP 1: Check Prerequisites
# --------------------------------------------------------------------------
Write-Step "1/11" "Checking Prerequisites"

$prerequisites = @(
    @{ Name = "aws"; Display = "AWS CLI"; Url = "https://aws.amazon.com/cli/" },
    @{ Name = "sam"; Display = "SAM CLI"; Url = "https://docs.aws.amazon.com/sam/" },
    @{ Name = "node"; Display = "Node.js"; Url = "https://nodejs.org/" },
    @{ Name = "npm"; Display = "npm"; Url = "https://nodejs.org/" },
    @{ Name = "git"; Display = "git"; Url = "https://git-scm.com/" }
)

$allPresent = $true
foreach ($prereq in $prerequisites) {
    if (Test-Command $prereq.Name) {
        $version = & $prereq.Name --version 2>$null | Select-Object -First 1
        Write-Success "$($prereq.Display): $version"
    } else {
        Write-Err "$($prereq.Display) not found! Install from: $($prereq.Url)"
        $allPresent = $false
    }
}

if (-not $allPresent) {
    Write-Host ""
    Write-Err "Missing prerequisites. Please install the tools above and try again."
    exit 1
}

# Verify AWS credentials are configured
try {
    $callerIdentity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) { throw "AWS credentials not configured" }
    Write-Success "AWS Account: $($callerIdentity.Account) (User: $($callerIdentity.Arn))"
} catch {
    Write-Err "AWS credentials not configured. Run 'aws configure' first."
    exit 1
}



# --------------------------------------------------------------------------
# STEP 2: Gather User Inputs
# --------------------------------------------------------------------------
Write-Step "2/11" "Gathering Deployment Configuration"

# AWS Region
$region = Read-Host "  AWS Region (default: us-east-1)"
if ([string]::IsNullOrWhiteSpace($region)) { $region = "us-east-1" }
Write-Info "Region: $region"

# Environment
$env_name = Read-Host "  Environment [dev/staging/prod] (default: prod)"
if ([string]::IsNullOrWhiteSpace($env_name)) { $env_name = "prod" }
if ($env_name -notin @('dev', 'staging', 'prod')) {
    Write-Err "Invalid environment. Must be: dev, staging, or prod"
    exit 1
}
Write-Info "Environment: $env_name"

# Stack name
$stackName = "$STACK_NAME_PREFIX-$env_name"
Write-Info "Stack Name: $stackName"

# Check if re-deploying
$isRedeployment = Test-StackExists -StackName $stackName -Region $region
if ($isRedeployment) {
    Write-Warn "Stack '$stackName' already exists. This will UPDATE the existing deployment."
    $continueRedeploy = Read-Host "  Continue with re-deployment? (Y/n)"
    if ($continueRedeploy -eq 'n') { exit 0 }
}

# API Keys
Write-Host ""
Write-Host "  ── API Keys ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Get free API keys from:" -ForegroundColor Gray
Write-Host "    • Groq (REQUIRED):  https://console.groq.com" -ForegroundColor Gray
Write-Host "    • Gemini (optional): https://aistudio.google.com" -ForegroundColor Gray
Write-Host "    • OpenRouter (optional): https://openrouter.ai" -ForegroundColor Gray
Write-Host ""

$groqKey = Read-Host "  Groq API Key (REQUIRED)"
if ([string]::IsNullOrWhiteSpace($groqKey)) {
    Write-Err "Groq API Key is required! Get one free at https://console.groq.com"
    exit 1
}
Write-Success "Groq API Key: ****$($groqKey.Substring([Math]::Max(0, $groqKey.Length - 4)))"

$geminiKey = Read-Host "  Gemini API Key (optional, press Enter to skip)"
if ([string]::IsNullOrWhiteSpace($geminiKey)) { $geminiKey = "NONE" }
else { Write-Success "Gemini API Key: ****$($geminiKey.Substring([Math]::Max(0, $geminiKey.Length - 4)))" }

$openRouterKey = Read-Host "  OpenRouter API Key (optional, press Enter to skip)"
if ([string]::IsNullOrWhiteSpace($openRouterKey)) { $openRouterKey = "NONE" }
else { Write-Success "OpenRouter API Key: ****$($openRouterKey.Substring([Math]::Max(0, $openRouterKey.Length - 4)))" }

# Daily request limit
$dailyLimit = Read-Host "  Daily request limit per user (default: 3)"
if ([string]::IsNullOrWhiteSpace($dailyLimit)) { $dailyLimit = "3" }
Write-Info "Daily limit: $dailyLimit requests/user/day"

Write-Host ""
Write-Success "Configuration complete!"

# --------------------------------------------------------------------------
# STEP 3: Install Frontend Dependencies
# --------------------------------------------------------------------------
Write-Step "3/11" "Installing Frontend Dependencies"

try {
    Write-Info "Running npm ci..."
    npm ci 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
    Write-Success "Dependencies installed successfully"
} catch {
    Write-Err "Failed to install dependencies: $_"
    Write-Info "Trying npm install as fallback..."
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Err "npm install also failed. Check package.json and try again."
        exit 1
    }
    Write-Success "Dependencies installed (via npm install)"
}



# --------------------------------------------------------------------------
# STEP 4: Validate SAM Template
# --------------------------------------------------------------------------
Write-Step "4/11" "Validating SAM Template"

try {
    sam validate --region $region 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "SAM validation failed" }
    Write-Success "SAM template is valid"
} catch {
    Write-Err "SAM template validation failed: $_"
    Write-Info "Ensure template.yaml exists in the project root."
    exit 1
}

# --------------------------------------------------------------------------
# STEP 5: Build SAM Application
# --------------------------------------------------------------------------
Write-Step "5/11" "Building SAM Application"

try {
    Write-Info "Running sam build (this may take 1-2 minutes)..."
    sam build --region $region 2>&1 | ForEach-Object {
        if ($_ -match "Build Succeeded") { Write-Success $_ }
    }
    if ($LASTEXITCODE -ne 0) { throw "SAM build failed" }
    Write-Success "SAM build completed successfully"
} catch {
    Write-Err "SAM build failed: $_"
    exit 1
}

# --------------------------------------------------------------------------
# STEP 6: Deploy SAM Stack
# --------------------------------------------------------------------------
Write-Step "6/11" "Deploying SAM Stack to AWS"

try {
    $deployParams = @(
        "--stack-name", $stackName,
        "--region", $region,
        "--resolve-s3",
        "--capabilities", "CAPABILITY_IAM", "CAPABILITY_AUTO_EXPAND",
        "--no-confirm-changeset",
        "--no-fail-on-empty-changeset",
        "--parameter-overrides",
        "Environment=$env_name",
        "GroqApiKey=$groqKey",
        "GeminiApiKey=$geminiKey",
        "OpenRouterApiKey=$openRouterKey",
        "DailyRequestLimit=$dailyLimit"
    )

    if ($isRedeployment) {
        Write-Info "Updating existing stack '$stackName'..."
    } else {
        Write-Info "Creating new stack '$stackName' (this may take 5-10 minutes)..."
    }

    sam deploy @deployParams 2>&1 | ForEach-Object {
        if ($_ -match "Successfully created/updated stack") { Write-Success $_ }
        elseif ($_ -match "Deploying with following values") { Write-Info "Deployment in progress..." }
    }
    
    if ($LASTEXITCODE -ne 0) { throw "SAM deploy failed" }
    Write-Success "Stack deployed successfully!"
} catch {
    Write-Err "Deployment failed: $_"
    Write-Info "Check the AWS CloudFormation console for detailed error messages."
    exit 1
}



# --------------------------------------------------------------------------
# STEP 7: Get Stack Outputs
# --------------------------------------------------------------------------
Write-Step "7/11" "Retrieving Stack Outputs"

try {
    $cloudFrontUrl = Get-StackOutput -StackName $stackName -OutputKey "CloudFrontURL" -Region $region
    $cognitoPoolId = Get-StackOutput -StackName $stackName -OutputKey "CognitoUserPoolId" -Region $region
    $cognitoClientId = Get-StackOutput -StackName $stackName -OutputKey "CognitoUserPoolClientId" -Region $region
    $apiUrl = Get-StackOutput -StackName $stackName -OutputKey "ApiUrl" -Region $region
    $s3Bucket = Get-StackOutput -StackName $stackName -OutputKey "FrontendBucketName" -Region $region
    $distributionId = Get-StackOutput -StackName $stackName -OutputKey "CloudFrontDistributionId" -Region $region

    # Validate critical outputs
    if ([string]::IsNullOrWhiteSpace($apiUrl)) {
        # Try alternative output key names
        $apiUrl = Get-StackOutput -StackName $stackName -OutputKey "ApiEndpoint" -Region $region
    }
    if ([string]::IsNullOrWhiteSpace($s3Bucket)) {
        $s3Bucket = Get-StackOutput -StackName $stackName -OutputKey "S3BucketName" -Region $region
    }
    if ([string]::IsNullOrWhiteSpace($cloudFrontUrl)) {
        $cloudFrontUrl = Get-StackOutput -StackName $stackName -OutputKey "DistributionDomainName" -Region $region
    }

    Write-Success "CloudFront URL:   $cloudFrontUrl"
    Write-Success "API URL:          $apiUrl"
    Write-Success "Cognito Pool ID:  $cognitoPoolId"
    Write-Success "Cognito Client:   $cognitoClientId"
    Write-Success "S3 Bucket:        $s3Bucket"
    Write-Success "Distribution ID:  $distributionId"
} catch {
    Write-Err "Failed to retrieve stack outputs: $_"
    Write-Info "Check if the stack deployed correctly in AWS Console."
    exit 1
}

# --------------------------------------------------------------------------
# STEP 8: Generate .env.production
# --------------------------------------------------------------------------
Write-Step "8/11" "Generating .env.production"

$envContent = @"
# Auto-generated by deploy.ps1 on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# Stack: $stackName | Region: $region | Environment: $env_name

VITE_API_URL=$apiUrl
VITE_COGNITO_USER_POOL_ID=$cognitoPoolId
VITE_COGNITO_CLIENT_ID=$cognitoClientId
VITE_CLOUDFRONT_URL=$cloudFrontUrl
VITE_AWS_REGION=$region
VITE_ENVIRONMENT=$env_name
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8 -Force
Write-Success ".env.production generated"



# --------------------------------------------------------------------------
# STEP 9: Build Frontend
# --------------------------------------------------------------------------
Write-Step "9/11" "Building Frontend Application"

try {
    Write-Info "Running npm run build..."
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
    
    if (-not (Test-Path "dist")) {
        throw "dist/ directory not found after build"
    }
    
    $fileCount = (Get-ChildItem -Path "dist" -Recurse -File).Count
    Write-Success "Frontend built successfully ($fileCount files)"
} catch {
    Write-Err "Frontend build failed: $_"
    Write-Info "Check for TypeScript/build errors and try again."
    exit 1
}

# --------------------------------------------------------------------------
# STEP 10: Sync to S3 with Cache Headers
# --------------------------------------------------------------------------
Write-Step "10/11" "Uploading Frontend to S3"

try {
    # Upload index.html with no-cache headers (always fresh)
    Write-Info "Uploading index.html (no-cache)..."
    aws s3 cp "dist/index.html" "s3://$s3Bucket/index.html" `
        --cache-control "no-cache, no-store, must-revalidate" `
        --content-type "text/html" `
        --region $region 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Failed to upload index.html" }
    Write-Success "index.html uploaded (no-cache)"

    # Upload assets with immutable cache (hashed filenames)
    Write-Info "Uploading assets/ (immutable, 1 year cache)..."
    aws s3 sync "dist/assets" "s3://$s3Bucket/assets" `
        --cache-control "public, max-age=31536000, immutable" `
        --region $region `
        --delete 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Failed to sync assets" }
    Write-Success "Assets uploaded (immutable cache)"

    # Upload remaining files (favicon, manifest, etc.)
    Write-Info "Uploading remaining static files..."
    aws s3 sync "dist" "s3://$s3Bucket" `
        --cache-control "public, max-age=3600" `
        --region $region `
        --exclude "index.html" `
        --exclude "assets/*" `
        --delete 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Failed to sync remaining files" }
    Write-Success "All files uploaded to S3"

} catch {
    Write-Err "S3 upload failed: $_"
    exit 1
}

# --------------------------------------------------------------------------
# STEP 11: Invalidate CloudFront Cache
# --------------------------------------------------------------------------
Write-Step "11/11" "Invalidating CloudFront Cache"

try {
    if ([string]::IsNullOrWhiteSpace($distributionId)) {
        Write-Warn "No CloudFront Distribution ID found. Skipping invalidation."
    } else {
        $invalidation = aws cloudfront create-invalidation `
            --distribution-id $distributionId `
            --paths "/*" `
            --region $region `
            --output json 2>&1 | ConvertFrom-Json
        
        if ($LASTEXITCODE -ne 0) { throw "CloudFront invalidation failed" }
        
        $invalidationId = $invalidation.Invalidation.Id
        Write-Success "CloudFront invalidation created: $invalidationId"
        Write-Info "Cache will be cleared within 5-10 minutes globally."
    }
} catch {
    Write-Warn "CloudFront invalidation failed: $_"
    Write-Info "You can manually invalidate from the AWS Console."
}



# ============================================================================
# SAVE DEPLOYMENT INFO
# ============================================================================

$deploymentInfo = @{
    stackName       = $stackName
    region          = $region
    environment     = $env_name
    deployedAt      = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
    outputs         = @{
        cloudFrontUrl   = $cloudFrontUrl
        apiUrl          = $apiUrl
        cognitoPoolId   = $cognitoPoolId
        cognitoClientId = $cognitoClientId
        s3Bucket        = $s3Bucket
        distributionId  = $distributionId
    }
    configuration   = @{
        dailyLimit      = $dailyLimit
        hasGroqKey      = $true
        hasGeminiKey    = ($geminiKey -ne "NONE")
        hasOpenRouterKey = ($openRouterKey -ne "NONE")
    }
}

$deploymentInfo | ConvertTo-Json -Depth 4 | Out-File -FilePath "deployment-output.json" -Encoding UTF8 -Force
Write-Success "Deployment info saved to deployment-output.json"

# ============================================================================
# FINAL SUMMARY
# ============================================================================

Write-Host ""
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ║        ✓ DEPLOYMENT COMPLETE - NexuCV AI Resume Analyzer             ║" -ForegroundColor Green
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ╠══════════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ║  Application URL:                                                    ║" -ForegroundColor Green
Write-Host "  ║  " -ForegroundColor Green -NoNewline
Write-Host "  https://$cloudFrontUrl" -ForegroundColor White -NoNewline
$padding1 = 68 - ("  https://$cloudFrontUrl").Length
if ($padding1 -gt 0) { Write-Host (" " * $padding1) -NoNewline }
Write-Host "║" -ForegroundColor Green
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ║  API Endpoint:                                                       ║" -ForegroundColor Green
Write-Host "  ║  " -ForegroundColor Green -NoNewline
Write-Host "  $apiUrl" -ForegroundColor White -NoNewline
$padding2 = 68 - ("  $apiUrl").Length
if ($padding2 -gt 0) { Write-Host (" " * $padding2) -NoNewline }
Write-Host "║" -ForegroundColor Green
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ╠══════════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ║  Stack:          $stackName" -ForegroundColor Cyan -NoNewline
$padding3 = 52 - $stackName.Length
if ($padding3 -gt 0) { Write-Host (" " * $padding3) -NoNewline }
Write-Host "║" -ForegroundColor Green
Write-Host "  ║  Region:         $region" -ForegroundColor Cyan -NoNewline
$padding4 = 52 - $region.Length
if ($padding4 -gt 0) { Write-Host (" " * $padding4) -NoNewline }
Write-Host "║" -ForegroundColor Green
Write-Host "  ║  Environment:    $env_name" -ForegroundColor Cyan -NoNewline
$padding5 = 52 - $env_name.Length
if ($padding5 -gt 0) { Write-Host (" " * $padding5) -NoNewline }
Write-Host "║" -ForegroundColor Green
Write-Host "  ║  Daily Limit:    $dailyLimit requests/user/day" -ForegroundColor Cyan -NoNewline
$padding6 = 52 - "$dailyLimit requests/user/day".Length
if ($padding6 -gt 0) { Write-Host (" " * $padding6) -NoNewline }
Write-Host "║" -ForegroundColor Green
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ╠══════════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "  ║  Cognito Pool ID:    $cognitoPoolId" -ForegroundColor DarkCyan -NoNewline
$padding7 = 48 - "$cognitoPoolId".Length
if ($padding7 -gt 0) { Write-Host (" " * $padding7) -NoNewline }
Write-Host "║" -ForegroundColor Green
Write-Host "  ║  Cognito Client ID:  $cognitoClientId" -ForegroundColor DarkCyan -NoNewline
$padding8 = 48 - "$cognitoClientId".Length
if ($padding8 -gt 0) { Write-Host (" " * $padding8) -NoNewline }
Write-Host "║" -ForegroundColor Green
Write-Host "  ║  S3 Bucket:          $s3Bucket" -ForegroundColor DarkCyan -NoNewline
$padding9 = 48 - "$s3Bucket".Length
if ($padding9 -gt 0) { Write-Host (" " * $padding9) -NoNewline }
Write-Host "║" -ForegroundColor Green
Write-Host "  ║  Distribution ID:    $distributionId" -ForegroundColor DarkCyan -NoNewline
$padding10 = 48 - "$distributionId".Length
if ($padding10 -gt 0) { Write-Host (" " * $padding10) -NoNewline }
Write-Host "║" -ForegroundColor Green
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ╠══════════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ║  Next Steps:                                                         ║" -ForegroundColor Yellow
Write-Host "  ║    1. Visit the Application URL above                                ║" -ForegroundColor Gray
Write-Host "  ║    2. Create an account using Cognito sign-up                        ║" -ForegroundColor Gray
Write-Host "  ║    3. Upload your resume and get AI-powered analysis!                ║" -ForegroundColor Gray
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ║  To destroy all resources:                                           ║" -ForegroundColor Yellow
Write-Host "  ║    .\deploy.ps1 -Destroy                                             ║" -ForegroundColor Gray
Write-Host "  ║                                                                      ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Deployment completed in $([math]::Round(((Get-Date) - $deployStart).TotalSeconds)) seconds" -ForegroundColor DarkGray
Write-Host ""
