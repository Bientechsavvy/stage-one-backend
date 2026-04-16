const axios = require("axios");
const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const getAgeGroup = require("../utils/ageGroup");

exports.createProfile = async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Name is required",
    });
  }

  // CHECK DUPLICATE
  db.query(
    "SELECT * FROM profiles WHERE name = ?",
    [name.toLowerCase()],
    async (err, results) => {
      if (results.length > 0) {
        return res.json({
          status: "success",
          message: "Profile already exists",
          data: results[0],
        });
      }

      try {
        const genderRes = await axios.get(`https://api.genderize.io?name=${name}`);
        const ageRes = await axios.get(`https://api.agify.io?name=${name}`);
        const natRes = await axios.get(`https://api.nationalize.io?name=${name}`);

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

        if (!natRes.data.country || natRes.data.country.length === 0) {
          return res.status(502).json({
            status: "error",
            message: "Nationalize returned an invalid response",
          });
        }

        const topCountry = natRes.data.country[0];

        const profile = {
          id: uuidv4(),
          name: name.toLowerCase(),
          gender: genderRes.data.gender,
          gender_probability: genderRes.data.probability,
          sample_size: genderRes.data.count,
          age: ageRes.data.age,
          age_group: getAgeGroup(ageRes.data.age),
          country_id: topCountry.country_id,
          country_probability: topCountry.probability,
          created_at: new Date().toISOString(),
        };

        db.query("INSERT INTO profiles SET ?", profile);

        return res.status(201).json({
          status: "success",
          data: profile,
        });

      } catch (error) {
        return res.status(500).json({
          status: "error",
          message: "Server error",
        });
      }
    }
  );
};