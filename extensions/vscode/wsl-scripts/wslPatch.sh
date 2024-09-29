#!/bin/bash

# ***********************************************
# * Save this script with EOL as LF,            *
# * otherwise, it will fail to run              *
# ***********************************************
# * This script is intended to be run inside    *
# * the WSL environment                         *
# ***********************************************

# Set -x for debug output
# set -x

wslUser=$(whoami)
wslDownloadScript=$1
BANANA_COMMIT_ID=$2
VSC_COMMIT_ID=$3
quality="stable" # banana only has stable right now, no insiders.

echo "BANANA_COMMIT_ID: $BANANA_COMMIT_ID"
echo "VSC_COMMIT_ID: $VSC_COMMIT_ID"

# ----------------------------

bananaServerLocation="/home/$wslUser/.BananaAI-server/bin"
productJsonFile="$bananaServerLocation/$VSC_COMMIT_ID/product.json"
serverFile="$bananaServerLocation/$VSC_COMMIT_ID/out/vs/server/node/server.main.js"

# ----------------------------

# Download the server files
if [ ! -f "$wslDownloadScript" ]; then
    echo "wslDownloadScript not found: $wslDownloadScript"
    exit 1
fi

echo "Running wslDownloadScript: $wslDownloadScript"
bash "$wslDownloadScript" "$VSC_COMMIT_ID" "$quality" "$bananaServerLocation"
if [ $? -eq 0 ]; then
    echo "wslDownloadScript executed successfully"
else
    echo "wslDownloadScript failed to execute"
    exit 1
fi

# ----------------------------

# Check if the serverFile exists
if [ ! -f "$serverFile" ]; then
    echo "Server file not found: $serverFile"
    exit 1
fi

# patch the server file
sed -i '0,/if(!\([A-Za-z0-9_]*\)){if(this\.\([A-Za-z0-9_]*\)\.isBuilt)return \([A-Za-z0-9_]*\)(\"Unauthorized client refused\");/s//if(\1){if(this.\2.isBuilt)return \3("Unauthorized client refused");/' "$serverFile"

# Check if the sed command was successful
if [ $? -eq 0 ]; then
    echo "Successfully patched server file: $serverFile"
else
    echo "Failed to patch server file: $serverFile"
    exit 1
fi

# ----------------------------

# Check if the productJsonFile exists
if [ ! -f "$productJsonFile" ]; then
    echo "Product JSON file not found: $productJsonFile"
    exit 1
fi

# patch the productJsonFile
sed -i "s/\"commit\": \"[^\"]*\"/\"commit\": \"$BANANA_COMMIT_ID\"/" "$productJsonFile"

# Check if the sed command was successful
if [ $? -eq 0 ]; then
    echo "Successfully patched Product JSON file: $productJsonFile"
else
    echo "Failed to modify the Product JSON file: $productJsonFile"
    exit 1
fi

# ----------------------------

# Rename the server folder to BANANA_COMMIT_ID
if [ -d "$bananaServerLocation/$VSC_COMMIT_ID" ]; then
    mv "$bananaServerLocation/$VSC_COMMIT_ID" "$bananaServerLocation/$BANANA_COMMIT_ID"
    if [ $? -eq 0 ]; then
        echo "Successfully renamed server folder to $bananaServerLocation/$BANANA_COMMIT_ID"
    else
        echo "Failed to rename server folder"
        exit 1
    fi
else
    echo "server folder $bananaServerLocation/$VSC_COMMIT_ID does not exist"
    exit 1
fi

# ----------------------------

# new paths now -
serverFile="$bananaServerLocation/$BANANA_COMMIT_ID/out/vs/server/node/server.main.js"
productJsonFile="$bananaServerLocation/$BANANA_COMMIT_ID/product.json"

# ----------------------------

echo -e "\nWSL INSTALLED AND PATCHED - you can close this terminal now"
