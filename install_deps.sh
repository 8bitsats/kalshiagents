#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")"

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "✗ Virtual environment not found"
    exit 1
fi

echo "Installing essential dependencies..."

# Install essential packages first (skip onnxruntime which doesn't support Python 3.14)
pip install "xai-sdk>=1.4.0" python-dotenv httpx || {
    echo "⚠ Failed to install essential packages"
    exit 1
}

echo "Installing remaining dependencies (skipping problematic packages)..."

# Install from requirements.txt but skip onnxruntime
pip install -r <(grep -v "^onnxruntime" requirements.txt) 2>&1 | grep -v "ERROR: Could not find a version" || {
    echo "⚠ Some packages may have failed, but continuing..."
}

# Try to install onnxruntime with a compatible version or skip it
echo "Attempting to install onnxruntime (may fail on Python 3.14)..."
pip install onnxruntime 2>/dev/null || {
    echo "⚠ onnxruntime not available for Python 3.14 - skipping (not critical for core functionality)"
}

echo ""
echo "✓ Dependency installation complete!"
echo ""
echo "Note: If you encounter missing module errors, you may need to:"
echo "  1. Use Python 3.9 (as recommended in README)"
echo "  2. Or install missing packages individually: pip install <package-name>"

