const express = require("express");
const cors = require("cors");
const { port } = require("./config");
const { ensureDb } = require("./db");
const getRoutes = require("./routes/API/GET");
const createRoutes = require("./routes/API/CREATE");
const updateRoutes = require("./routes/API/UPDATE");
const deleteRoutes = require("./routes/API/DELETE");

const app = express();

ensureDb();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Vreme API deluje.",
    projectStructure: {
      GET: "/API/GET",
      CREATE: "/API/CREATE",
      UPDATE: "/API/UPDATE",
      DELETE: "/API/DELETE",
    },
  });
});

app.use("/API/GET", getRoutes);
app.use("/API/CREATE", createRoutes);
app.use("/API/UPDATE", updateRoutes);
app.use("/API/DELETE", deleteRoutes);

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} je ze zaseden. Pozeni 'npm run start:3005' ali nastavi drug PORT.`
    );
    process.exit(1);
  }

  console.error("Napaka pri zagonu streznika:", error);
  process.exit(1);
});
