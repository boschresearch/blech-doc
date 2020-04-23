#!/bin/bash
echo "Building website for production"
cd ..
export HUGO_ENV=production
hugo server --baseURL "" --disableFastRender
