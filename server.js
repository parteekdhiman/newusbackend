require("dotenv").config();
const express = require("express");
const enquri = require("./controllers/enquri");
const app = express();
const cors = require("cors");
const router = require("./controllers/support");
app.use(express.json());

app.use(cors({
  origin: 'https://newus.in', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));
app.use("/enquri", enquri);
app.use("/support-form", router);
app.listen(process.env.PORT || 3000, () => {
  console.log(`server running`);
});
