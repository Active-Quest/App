var express = require('express');
var router = express.Router();
var activityController = require('../controllers/activityController.js');

router.get('/', activityController.list);

router.get('/:id', activityController.show);

router.post('/', activityController.create);

router.put('/:id', activityController.update);

router.delete('/:id', activityController.remove);

module.exports = router;
