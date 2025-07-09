#!/bin/bash

# Check if --file= argument is provided (POSIX compatible)
if [ "${1#--file=}" = "$1" ]; then
  echo "[ERROR] Please provide the file as --file=YOUR_FILE_PATH."
  exit 0
fi

INPUT_FILE="${1#--file=}"

source .venv/Scripts/activate

# Run the Python script with the given file
python pdf_splitter_logic_for_n8n.py --path="$INPUT_FILE"

echo "PDF splitting completed for $INPUT_FILE."
