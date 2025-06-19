const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, favoriteController.addFavorite);
router.get('/', verifyToken, favoriteController.getFavorites);
router.delete('/:id', verifyToken, favoriteController.deleteFavorite);
router.delete('/place/:placeId', verifyToken, favoriteController.deleteFavoriteByPlaceId);
router.get('/status/:placeId', verifyToken, favoriteController.getFavoriteStatus);

module.exports = router;
