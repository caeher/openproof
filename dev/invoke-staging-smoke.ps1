param(
    [string]$ApiBaseUrl = "http://127.0.0.1:3001",
    [string]$PackageCode = "starter",
    [int]$PollIntervalSeconds = 10,
    [int]$WaitForPaymentSeconds = 300,
    [string]$Password = "Openproof123!",
    [string]$DocumentHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    [string]$DocumentFilename = "staging-smoke.txt"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-ErrorResponse {
    param($Exception)

    $response = $Exception.Exception.Response
    if (-not $response) {
        throw $Exception
    }

    $stream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    $json = $null

    if ($content) {
        try {
            $json = $content | ConvertFrom-Json
        } catch {
            $json = $null
        }
    }

    return [pscustomobject]@{
        StatusCode = [int]$response.StatusCode
        Body = $json
        RawContent = $content
    }
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body,
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session
    )

    $uri = "$ApiBaseUrl$Path"
    $jsonBody = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 10 } else { $null }

    try {
        $response = Invoke-WebRequest -Method $Method -Uri $uri -WebSession $Session -ContentType "application/json" -Body $jsonBody -UseBasicParsing
        $parsed = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
        return [pscustomobject]@{
            StatusCode = [int]$response.StatusCode
            Body = $parsed
        }
    } catch {
        return Read-ErrorResponse -Exception $_
    }
}

function Assert-Success {
    param(
        [object]$Response,
        [string]$Context
    )

    if ($Response.StatusCode -lt 200 -or $Response.StatusCode -ge 300) {
        $message = if ($Response.Body -and $Response.Body.error) {
            $Response.Body.error
        } elseif ($Response.RawContent) {
            $Response.RawContent
        } else {
            "HTTP $($Response.StatusCode)"
        }

        throw "$Context failed: $message"
    }

    if ($Response.Body -and $null -ne $Response.Body.success -and -not $Response.Body.success) {
        throw "$Context failed: $($Response.Body.error)"
    }
}

$health = Invoke-WebRequest -Uri "$ApiBaseUrl/health" -UseBasicParsing
if ($health.Content.Trim() -ne "ok") {
    throw "Health check failed."
}

$packagesResponse = Invoke-Api -Method "GET" -Path "/api/v1/billing/packages"
Assert-Success -Response $packagesResponse -Context "Load billing packages"

$package = $packagesResponse.Body.data | Where-Object { $_.code -eq $PackageCode } | Select-Object -First 1
if (-not $package) {
    throw "Package '$PackageCode' not found in public billing packages."
}

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "staging+$timestamp@openproof.local"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "Creating staging smoke user: $email" -ForegroundColor Cyan

$signupResponse = Invoke-Api -Method "POST" -Path "/api/v1/auth/signup" -Session $session -Body @{
    email = $email
    password = $Password
}
Assert-Success -Response $signupResponse -Context "Signup"

$verificationToken = $signupResponse.Body.data.devVerificationToken
if (-not $verificationToken) {
    throw "Signup did not return devVerificationToken. Keep EXPOSE_DEV_AUTH_TOKENS=true for this smoke flow."
}

$verifyResponse = Invoke-Api -Method "POST" -Path "/api/v1/auth/verify-email" -Session $session -Body @{
    token = $verificationToken
}
Assert-Success -Response $verifyResponse -Context "Verify email"

$loginResponse = Invoke-Api -Method "POST" -Path "/api/v1/auth/login" -Session $session -Body @{
    email = $email
    password = $Password
}
Assert-Success -Response $loginResponse -Context "Login"

$overviewResponse = Invoke-Api -Method "GET" -Path "/api/v1/billing/overview" -Session $session
Assert-Success -Response $overviewResponse -Context "Load billing overview"

$paymentIntentResponse = Invoke-Api -Method "POST" -Path "/api/v1/billing/payment-intents" -Session $session -Body @{
    packageId = $package.id
}
Assert-Success -Response $paymentIntentResponse -Context "Create payment intent"

$paymentIntent = $paymentIntentResponse.Body.data

Write-Host "Payment intent created." -ForegroundColor Green
Write-Host "Package: $($paymentIntent.packageCode)"
Write-Host "Payment intent ID: $($paymentIntent.id)"
Write-Host "Payment hash: $($paymentIntent.paymentHash)"
Write-Host "Invoice: $($paymentIntent.paymentRequest)"
Write-Host "Open Blink staging and pay the invoice before the timeout expires." -ForegroundColor Yellow

$deadline = (Get-Date).AddSeconds($WaitForPaymentSeconds)
$reconciled = $paymentIntent

while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds $PollIntervalSeconds

    $reconcileResponse = Invoke-Api -Method "POST" -Path "/api/v1/billing/payment-intents/$($paymentIntent.id)/reconcile" -Session $session
    Assert-Success -Response $reconcileResponse -Context "Reconcile payment intent"
    $reconciled = $reconcileResponse.Body.data

    Write-Host "Current payment status: $($reconciled.status) / invoice $($reconciled.blinkInvoiceStatus)"

    if ($reconciled.status -eq "paid") {
        break
    }

    if ($reconciled.status -eq "expired") {
        throw "Payment intent expired before settlement."
    }
}

if ($reconciled.status -ne "paid") {
    throw "Payment intent did not settle within $WaitForPaymentSeconds seconds."
}

$registerResponse = Invoke-Api -Method "POST" -Path "/api/v1/documents" -Session $session -Body @{
    fileHash = $DocumentHash
    filename = $DocumentFilename
    metadata = @{ description = "staging smoke" }
}
Assert-Success -Response $registerResponse -Context "Register document"

$document = $registerResponse.Body.data

Write-Host "Smoke flow completed successfully." -ForegroundColor Green
Write-Host "Document ID: $($document.documentId)"
Write-Host "Document status: $($document.status)"
Write-Host "Transaction ID: $($document.transactionId)"