#!/bin/sh
set -e

SSDP=$(date | md5sum | cut -f 1 -d " ")
echo "module.exports = '$SSDP'" > "SSDP.js"
