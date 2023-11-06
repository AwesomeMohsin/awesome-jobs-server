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


    // Token Generate
    app.post("/jwt", async (req, res) => {
      const data = req.body;
      const token = jwt.sign(data, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: "1d",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        })
        .send({ success: true });
    });


    // Post a Job
    app.post("/jobs", async (req, res) => {
      const jobData = req.body;
      const isValidJob = validateJob(jobData);

      if (isValidJob) {
        const formatDeadline = new Date(jobData.deadline).toISOString();
        jobData.deadline = formatDeadline;

        jobData.applicants = 0;

        const currentDate = new Date().toISOString();
        jobData.createdAt = currentDate;

        const result = await Job.insertOne(jobData);
        res.status(201).json({
          success: true,
          message: "Job Posted Successfully",
          result,
        });
      } else {
        res.status(400).json({ success: false, message: "Job Data Invalid" });
      }
    });

    // get jobs
    app.get("/jobs", async (req, res) => {
      const queryObj = { ...req.query };
      const excludeQueries = ["page", "sort", "limit", "fields", "search"];
      excludeQueries.forEach((el) => delete queryObj[el]);

      const queryString = JSON.stringify(queryObj);

      let filter = JSON.parse(queryString);

      if (req.query.search) {
        filter.title = { $regex: req.query.search, $options: "i" };
      }

      const projection = {
        banner: 0,
        description: 0,
        company: 0,
      };

      const result = await Job.find(filter).project(projection).toArray();

      res.status(200).json({
        success: true,
        message: "Jobs Successfully Retrieved",
        count: result.length,
        result,
      });
    });

    







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
