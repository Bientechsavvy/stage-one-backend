const axios = require("axios");
const db = require("../config/db");
const getAgeGroup = require("../utils/ageGroup");

// ===============================
// CREATE PROFILE (POST /profiles)
// ===============================
exports.createProfile = async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Name is required",
    });
  }

  const cleanName = name.trim().toLowerCase();

  // ===============================
  // CHECK DUPLICATE (IDEMPOTENCY)
  // ===============================
  db.query(
    "SELECT * FROM profiles WHERE name = ?",
    [cleanName],
    async (err, results) => {
      if (err) {
        return res.status(500).json({
          status: "error",
          message: "Database error",
        });
      }

      if (results.length > 0) {
        return res.json({
          status: "success",
          message: "Profile already exists",
          data: results[0],
        });
      }

      try {
        // ===============================
        // EXTERNAL API CALLS
        // ===============================
        const [genderRes, ageRes, natRes] = await Promise.all([
          axios.get(`https://api.genderize.io?name=${cleanName}`),
          axios.get(`https://api.agify.io?name=${cleanName}`),
          axios.get(`https://api.nationalize.io?name=${cleanName}`),
        ]);

        // ===============================
        // VALIDATION (STRICT RULES)
        // ===============================
        if (!genderRes.data.gender || genderRes.data.count === 0) {
          return res.status(502).json({
            status: "error",
            message: "Genderize returned an invalid response",
          });
        }

        if (!ageRes.data.age) {
          return res.status(502).json({
            status: "error",
            message: "Agify returned an invalid response",
          });
        }

        if (
          !natRes.data.country ||
          !Array.isArray(natRes.data.country) ||
          natRes.data.country.length === 0
        ) {
          return res.status(502).json({
            status: "error",
            message: "Nationalize returned an invalid response",
          });
        }

        const topCountry = natRes.data.country[0];

        // ===============================
        // BUILD PROFILE OBJECT
        // ===============================
        const profile = {
          id: require("uuid").v7(),
          name: cleanName,
          gender: genderRes.data.gender,
          gender_probability: genderRes.data.probability,
          sample_size: genderRes.data.count,
          age: ageRes.data.age,
          age_group: getAgeGroup(ageRes.data.age),
          country_id: topCountry.country_id,
          country_probability: topCountry.probability,
          created_at: new Date().toISOString(),
        };

        // ===============================
        // INSERT INTO DATABASE
        // ===============================
        db.query("INSERT INTO profiles SET ?", profile, (err) => {
          if (err) {
            return res.status(500).json({
              status: "error",
              message: "Failed to store profile",
            });
          }

          return res.status(201).json({
            status: "success",
            data: profile,
          });
        });
      } catch (error) {
        console.log("FULL ERROR:", error);

        return res.status(500).json({
          status: "error",
          message: error.message,
        });
      }
    }
  );
};

// ===============================
// GET ALL PROFILES
// ===============================
exports.getAllProfiles = (req, res) => {
  const { gender, country_id, age_group } = req.query;

  let query = "SELECT * FROM profiles WHERE 1=1";
  const params = [];

  if (gender) {
    query += " AND LOWER(gender) = ?";
    params.push(gender.toLowerCase());
  }

  if (country_id) {
    query += " AND LOWER(country_id) = ?";
    params.push(country_id.toLowerCase());
  }

  if (age_group) {
    query += " AND LOWER(age_group) = ?";
    params.push(age_group.toLowerCase());
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Database error",
      });
    }

    return res.json({
      status: "success",
      count: results.length,
      data: results,
    });
  });
};

// ===============================
// GET ONE PROFILE
// ===============================
exports.getProfileById = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM profiles WHERE id = ?", [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Database error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }

    return res.json({
      status: "success",
      data: results[0],
    });
  });
};

// ===============================
// DELETE PROFILE
// ===============================
exports.deleteProfile = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM profiles WHERE id = ?", [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Database error",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
    }

    return res.status(204).send();
  });
};
