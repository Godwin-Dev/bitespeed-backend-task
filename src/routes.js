const express = require("express");
const { Contact } = require("./models");
const router = express.Router();
const contactController = require('./controllers/contactController');


module.exports = router;
