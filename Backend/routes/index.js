var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/', (req, res) => {
  res.json({ message: 'API root' });
});

router.use('/activities', require('./activityRoutes'));

module.exports = router;

