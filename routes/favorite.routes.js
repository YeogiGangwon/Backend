const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, favoriteController.addFavorite);
router.get('/', verifyToken, favoriteController.getFavorites);
router.delete('/:id', verifyToken, favoriteController.deleteFavorite);

module.exports = router;
