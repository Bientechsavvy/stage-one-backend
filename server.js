require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./routes/profileRoutes");
console.log("DB PASSWORD:", process.env.DB_PASSWORD);


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", routes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
