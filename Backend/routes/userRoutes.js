var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');
const upload = require('../middleware/uploadMiddleware.js');

router.get('/', userController.list);

router.get('/me', userController.me);         
router.get('/profile', userController.profile);''
router.get('/logout', userController.logout);

router.post('/register', userController.create);
router.post('/login', userController.login);
router.post('/mobile-login', userController.mobileLogin);

router.put('/:id', userController.update);
router.delete('/:id', userController.remove);

router.get('/:id', userController.show);  

router.post('/upload-profile', upload.single('profileImage'), userController.uploadProfile);

module.exports = router;