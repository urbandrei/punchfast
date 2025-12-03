#!/bin/bash
npm install
(cd client && npm install && npm run build)
(cd server && npm install --ignore-scripts)
NODE_ENV=production node server/index.js
