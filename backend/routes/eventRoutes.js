var express = require('express');
var router = express.Router();
var eventController = require('../controllers/eventController.js');

router.get('/', eventController.list);

router.get('/:id', eventController.show);

router.post('/', eventController.create);

router.put('/:id', eventController.update);

router.delete('/:id', eventController.remove);

module.exports = router;
