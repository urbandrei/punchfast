set -e

cd client
npm install

npm run build

cd ..
cd server
npm install

mkdir -p public
cp -r ../client/build/* public/

node index.js
