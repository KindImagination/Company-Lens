# Company Lens - Library Setup Script (PowerShell)
# Automatically downloads required libraries for CV parsing

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Company Lens - Library Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "lib")) {
    Write-Host "Error: lib/ directory not found." -ForegroundColor Red
    Write-Host "Please run this script from the CompanyLens root directory." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Downloading required libraries..." -ForegroundColor Yellow
Write-Host ""

# Download PDF.js
Write-Host "1/3 Downloading PDF.js..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js" -OutFile "lib\pdf.min.js"
    Write-Host "✅ PDF.js downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download PDF.js" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""

# Download PDF.js Worker
Write-Host "2/3 Downloading PDF.js worker..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js" -OutFile "lib\pdf.worker.min.js"
    Write-Host "✅ PDF.js worker downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download PDF.js worker" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""

# Download Mammoth.js
Write-Host "3/3 Downloading Mammoth.js..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js" -OutFile "lib\mammoth.browser.min.js"
    Write-Host "✅ Mammoth.js downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download Mammoth.js" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ All libraries installed!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installed libraries:" -ForegroundColor White
Write-Host "  - PDF.js (for PDF parsing)" -ForegroundColor Gray
Write-Host "  - PDF.js worker (required by PDF.js)" -ForegroundColor Gray
Write-Host "  - Mammoth.js (for DOCX parsing)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Load extension in Chrome (chrome://extensions/)" -ForegroundColor Gray
Write-Host "  2. Get DeepSeek API key (https://platform.deepseek.com)" -ForegroundColor Gray
Write-Host "  3. Upload your CV in the extension popup" -ForegroundColor Gray
Write-Host ""
Write-Host "See QUICKSTART.md for detailed instructions." -ForegroundColor Yellow
Write-Host ""

