#!/bin/bash
# Script to launch Chrome with remote debugging enabled
# Uses your DEFAULT Chrome profile so your Bluesky session is preserved

# Kill any existing Chrome processes first
pkill -9 -f "Google Chrome" 2>/dev/null || true
sleep 2

# Path to Chrome
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Your default Chrome profile location
DEFAULT_PROFILE="$HOME/Library/Application Support/Google/Chrome"

# Launch Chrome with remote debugging using your default profile
"$CHROME_PATH" \
    --remote-debugging-port=9222 \
    --user-data-dir="$DEFAULT_PROFILE" \
    --no-first-run \
    --no-default-browser-check &

echo "Chrome launched with remote debugging on port 9222"
echo "Using your default profile: $DEFAULT_PROFILE"
echo "Your Bluesky session should be available"
echo ""
echo "Now run: cd bluesky-social-app && yarn e2e:playwright --grep 'connected'"