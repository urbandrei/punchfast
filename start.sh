#!/bin/bash
npm install
(cd client && npm install && npm run build)
NODE_ENV=production node server/index.js
