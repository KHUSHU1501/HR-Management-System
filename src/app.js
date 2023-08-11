const express = require("express");
const oracledb = require("oracledb");

const app = express();
const port = 3000;
const path = require("path");

// Middleware to parse JSON data
app.use(express.json());

// Set the view directory
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true })); // support encoded bodies

// Database Connection Configuration
const dbConfig = {
  user: "dbs501_232v1a02",
  password: "71901249",
  connectString:
    "(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = myoracle12c.senecacollege.ca)(PORT = 1521))(CONNECT_DATA =(SERVER = DEDICATED)(SERVICE_NAME = oracle12c)))",
};

// Establish the database connection
oracledb
  .getConnection(dbConfig)
  .then((connection) => {
    console.log("Connected to the Oracle database!");
    // Save the connection in a variable to reuse it in API routes
    app.locals.connection = connection;
  })
  .catch((err) => {
    console.error("Error connecting to the Oracle database:", err);
  });

// Set the view engine to EJS
app.set("view engine", "ejs");

// Render the home page
app.get("/", (req, res) => {
  res.render("index");
});

// Render the employee hiring form
app.get("/employee/hire", async (req, res) => {
  const connection = req.app.locals.connection;

  try {
    const jobsQuery = "SELECT JOB_ID, JOB_TITLE FROM hr_jobs";
    const managersQuery =
      "SELECT employee_id, first_name, last_name FROM hr_employees WHERE employee_id IN (SELECT manager_id FROM hr_employees )";
    const departmentsQuery =
      "SELECT DEPARTMENT_ID, DEPARTMENT_NAME FROM hr_departments";

    const jobsResult = await connection.execute(jobsQuery);
    const managersResult = await connection.execute(managersQuery);
    const departmentsResult = await connection.execute(departmentsQuery);

    const jobs = jobsResult.rows;
    const managers = managersResult.rows;
    const departments = departmentsResult.rows;
    const currentDate = new Date().toISOString().slice(0, 10);
    const error = null;
    res.render("employee-hiring", {
      jobs,
      managers,
      departments,
      currentDate,
      error,
    });
  } catch (err) {
    console.error("Error fetching data from the database:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/hire", async (req, res) => {
  const connection = req.app.locals.connection;
  const {
    firstName,
    lastName,
    email,
    salary,
    hireDate,
    phone,
    jobId,
    managerId,
    departmentId,
  } = req.body;

  // Format the hireDate string to match Oracle's expected format (YYYY-MM-DD)
  const formattedHireDate = new Date(hireDate).toISOString().slice(0, 10);

  try {
    await connection.execute(
      `BEGIN 
        hr_employee_hire_sp(
          :firstName, 
          :lastName, 
          :email, 
          :salary, 
          TO_DATE(:formattedHireDate, 'YYYY-MM-DD'), 
          :phone, 
          :jobId, 
          :managerId, 
          :departmentId
        ); 
      END;`,
      {
        firstName,
        lastName,
        email,
        salary,
        formattedHireDate,
        phone,
        jobId,
        managerId,
        departmentId,
      }
    );

    res.redirect("/employees");
  } catch (err) {
    console.error("Error hiring employee:", err);

    // Extract the first line of the error message
    const errorMessage = err.message.split("\n")[0];

    return res.send(
      `<script>alert('${errorMessage}'); window.location.href='/employee/hire';</script>`
    );
  }
});

app.get("/employees", async (req, res) => {
  const connection = req.app.locals.connection;

  try {
    const query = "SELECT * FROM hr_employees";
    const result = await connection.execute(query);
    const employees = result.rows;
    res.render("employee", { employees });
  } catch (err) {
    console.error("Error fetching data from the database:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to handle employee updates
app.post("/employees/update", async (req, res) => {
  const connection = req.app.locals.connection;
  const { employeeId, salary, phone, email } = req.body;

  try {
    // Update employee data in the database
    await connection.execute(
      "UPDATE hr_employees SET salary = :salary, phone_number = :phone, email = :email WHERE employee_id = :employeeId",
      { employeeId, salary, phone, email },
      { autoCommit: true }
    );

    // Redirect back to the employee list and management page
    res.redirect("/employees");
  } catch (err) {
    console.error("Error hiring employee:", err);

    // Extract the first line of the error message
    const errorMessage = err.message.split("\n")[0];

    return res.send(
      `<script>alert('${errorMessage}'); window.location.href='/employees';</script>`
    );
  }
});

// Display the list of jobs
app.get("/jobs", async (req, res) => {
  const connection = req.app.locals.connection;
  try {
    const query =
      "SELECT JOB_ID, JOB_TITLE, MIN_SALARY, MAX_SALARY FROM HR_JOBS";
    const result = await connection.execute(query);
    const jobs = result.rows;
    res.render("jobs", { jobs });
  } catch (err) {
    console.error("Error fetching data from the database:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Handle job update form submission
app.post("/jobs/update", async (req, res) => {
  const connection = req.app.locals.connection;

  const { jobId, jobTitle, minSalary, maxSalary } = req.body;
  try {
    const updateQuery = `
      UPDATE HR_JOBS
      SET JOB_TITLE = :jobTitle, MIN_SALARY = :minSalary, MAX_SALARY = :maxSalary
      WHERE JOB_ID = :jobId
    `;
    await connection.execute(
      updateQuery,
      { jobTitle, minSalary, maxSalary, jobId },
      { autoCommit: true }
    );
    res.redirect("/jobs");
  } catch (err) {
    console.error("Error updating job:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/jobs/description", (req, res) => {
  res.render("job-description");
});

app.get("/jobs/:jobId/description", async (req, res) => {
  const connection = req.app.locals.connection;
  const { jobId } = req.params;

  try {
    const result = await connection.execute(
      "SELECT job_title FROM hr_jobs WHERE job_id = :jobId",
      { jobId }
    );

    if (result.rows.length > 0) {
      const description = result.rows[0][0];
      res.json({ description });
    } else {
      res.status(404).json({ error: "Job ID not found" });
    }
  } catch (error) {
    console.error("Error fetching job description:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/jobs/add", (req, res) => {
  res.render("job-add");
});

app.post("/jobs/add", async (req, res) => {
  const connection = req.app.locals.connection;
  const { jobId, jobTitle, minSalary } = req.body;

  try {
    // Call the Oracle procedure to add a new job
    await connection.execute(
      "BEGIN new_job(:jobId, :jobTitle, :minSalary); END;",
      { jobId, jobTitle, minSalary }
    );

    res.redirect("/jobs");
  } catch (err) {
    console.error("Error adding job:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/departments", async (req, res) => {
  const connection = req.app.locals.connection;

  try {
    const query =
      "SELECT department_id, department_name, manager_id, location_id FROM hr_departments";
    const result = await connection.execute(query);
    const departments = result.rows;

    res.render("departments", { departments });
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
