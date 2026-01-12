var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');



router.get('/me', userController.me);         
router.get('/profile', userController.profile);
router.get('/logout', userController.logout);
router.post('/register', userController.create);
router.post('/login', userController.login);
router.post('/mobile-login', userController.mobileLogin);
router.get('/search', userController.find);
router.get('/check2FAStatus/:id', userController.check2FAStatus);
router.post('/:id/update2FA', userController.update2FA);
router.post('/:id/update2FAResult', userController.update2FAResult);
router.put('/:id/friends', userController.add);
router.get('/:id/friends', userController.listFriends);
router.put('/:id', userController.update);
router.delete('/:id', userController.remove);


router.get('/:id', userController.show);

  




module.exports = router;
