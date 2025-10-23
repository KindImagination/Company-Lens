#!/bin/bash

# Company Lens - Library Setup Script
# Automatically downloads required libraries for CV parsing

echo "=================================="
echo "Company Lens - Library Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -d "lib" ]; then
    echo "Error: lib/ directory not found."
    echo "Please run this script from the CompanyLens root directory."
    exit 1
fi

echo "📦 Downloading required libraries..."
echo ""

# Download PDF.js
echo "1/3 Downloading PDF.js..."
curl -L -o lib/pdf.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js
if [ $? -eq 0 ]; then
    echo "✅ PDF.js downloaded successfully"
else
    echo "❌ Failed to download PDF.js"
    exit 1
fi

echo ""

# Download PDF.js Worker
echo "2/3 Downloading PDF.js worker..."
curl -L -o lib/pdf.worker.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js
if [ $? -eq 0 ]; then
    echo "✅ PDF.js worker downloaded successfully"
else
    echo "❌ Failed to download PDF.js worker"
    exit 1
fi

echo ""

# Download Mammoth.js
echo "3/3 Downloading Mammoth.js..."
curl -L -o lib/mammoth.browser.min.js https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js
if [ $? -eq 0 ]; then
    echo "✅ Mammoth.js downloaded successfully"
else
    echo "❌ Failed to download Mammoth.js"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ All libraries installed!"
echo "=================================="
echo ""
echo "Installed libraries:"
echo "  - PDF.js (for PDF parsing)"
echo "  - PDF.js worker (required by PDF.js)"
echo "  - Mammoth.js (for DOCX parsing)"
echo ""
echo "Next steps:"
echo "  1. Load extension in Chrome (chrome://extensions/)"
echo "  2. Get DeepSeek API key (https://platform.deepseek.com)"
echo "  3. Upload your CV in the extension popup"
echo ""
echo "See QUICKSTART.md for detailed instructions."
echo ""

