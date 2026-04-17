const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

// CREATE PROFILE
router.post("/profiles", profileController.createProfile);

// GET ALL PROFILES
router.get("/profiles", profileController.getAllProfiles);

// GET ONE PROFILE
router.get("/profiles/:id", profileController.getProfileById);

// DELETE PROFILE
router.delete("/profiles/:id", profileController.deleteProfile);

module.exports = router;
