require("dotenv").config();
const express = require("express");
const enquri = require("./controllers/enquri");
const app = express();
const cors = require("cors");
const router = require("./controllers/support");
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));
app.use("/enquri", enquri);
app.use("/support-form", router);
app.listen(process.env.PORT || 3000, () => {
  console.log(`server running`);
});
