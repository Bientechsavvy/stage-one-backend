require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./routes/profileRoutes");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", routes);

app.listen(process.env.PORT, () => {
  console.log("Server running...");
});