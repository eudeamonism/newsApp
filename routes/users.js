const express = require('express');
const router = express.Router();



router.get('/users', (req, res) => {
	res.send('This is the user page.');
});





router.get('/test', (req, res) => {
res.render('archive')
})
module.exports = router;
