var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');

router.put('/:id/friends', userController.add);
router.get('/:id/friends', userController.listFriends);
router.get('/', userController.list);

router.get('/me', userController.me);         
router.get('/profile', userController.profile);
router.get('/logout', userController.logout);

router.post('/register', userController.create);
router.post('/login', userController.login);
router.post('/mobile-login', userController.mobileLogin);
router.get('/search', userController.find);

router.put('/:id', userController.update);
router.delete('/:id', userController.remove);

router.get('/:id', userController.show);   




module.exports = router;