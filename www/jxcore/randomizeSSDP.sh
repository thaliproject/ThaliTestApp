#!/bin/sh
set -e

SSDP=$(date | shasum | cut -f 1 -d " ")
echo "module.exports = '$SSDP'" > "SSDP.js"
