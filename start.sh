#!/bin/bash
npm install
cd client && npm install && npm run build && cd ..
NODE_ENV=production node server/index.js
