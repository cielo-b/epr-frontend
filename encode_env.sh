#!/bin/bash

if [ -f .env ]; then
    echo "Processing .env file..."
    # Encode to base64 with no wrapping (single line)
    encoded=$(base64 -w 0 .env)
    
    echo "---------------------------------------------------"
    echo "Add this logic to your GitHub Repository Secret named 'ENV_FILE_BASE64':"
    echo "---------------------------------------------------"
    echo "$encoded"
    echo "---------------------------------------------------"
    
    # Optional: Save to a file for easy copying
    echo "$encoded" > .env.base64
    echo "Also saved to .env.base64 (don't commit this file!)"
else
    echo "Error: .env file not found in current directory."
fi
