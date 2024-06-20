const express = require("express");
const { Contact } = require("./models");
const router = express.Router();
const contactController = require('./controllers/contactController');

router.post('/identify', contactController.identifyContact);

module.exports = router;
