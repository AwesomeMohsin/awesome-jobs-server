const cors = require("cors");
require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyJwt = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      res.status(403).json({ success: false, message: "Forbidden access" });
    }
    req.user = decoded.email;
    next();
  });
};

// validation
function validateJob(jobData) {
  if (
    jobData &&
    jobData.title &&
    jobData.type &&
    jobData.deadline &&
    jobData.min_salary !== undefined &&
    jobData.max_salary !== undefined &&
    jobData.company &&
    jobData.company.name &&
    jobData.created_by &&
    jobData.created_by.name &&
    jobData.created_by.email
  ) {
    return true;
  } else {
    return false;
  }
}

const uri = process.env.DATABASE_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const Job = client.db("job-portal-db").collection("job");

async function run() {
  try {
    

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Database connection established!");
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Awesome Jobs server listening on port ${port}`);
});
