const express = require("express");
const router = express.Router();
const controller = require("../controllers/profileController");

router.post("/profiles", controller.createProfile);

module.exports = router;