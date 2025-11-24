const express = require('express');
const router = express.Router();

const savedStoresController = require('../controllers/savedStoresController');

router.post('/toggle', savedStoresController.toggleSavedStore);

router.get('/:userId', savedStoresController.getUserSavedStores);

router.get('/check/:userId/:storeId', savedStoresController.checkStoreSaved);

module.exports = router;
