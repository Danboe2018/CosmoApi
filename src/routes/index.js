let express = require('express');
let router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: "Cosmos News API" })
});

module.exports = router;