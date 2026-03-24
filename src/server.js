const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { port, jwtSecret } = require("./config");
const { ensureDb, readDb, writeDb } = require("./db");
const authMiddleware = require("./middleware/auth");

const app = express();

ensureDb();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "JWT API deluje.",
    endpoints: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
      profile: "GET /api/users/me",
      weatherAll: "GET /api/weather",
      weatherFavorites: "GET /api/weather/favorites",
      weatherCreate: "POST /api/weather"
    }
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Polja username, email in password so obvezna.",
    });
  }

  const db = readDb();
  const existingUser = db.users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    return res.status(409).json({
      message: "Uporabnik s tem emailom ze obstaja.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: db.users.length + 1,
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);

  return res.status(201).json({
    message: "Registracija uspesna.",
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    },
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Polji email in password sta obvezni.",
    });
  }

  const db = readDb();
  const user = db.users.find(
    (item) => item.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return res.status(401).json({
      message: "Napacni podatki za prijavo.",
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({
      message: "Napacni podatki za prijavo.",
    });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    jwtSecret,
    { expiresIn: "1h" }
  );

  return res.json({
    message: "Prijava uspesna.",
    token,
  });
});

app.get("/api/users/me", authMiddleware, (req, res) => {
  return res.json({
    message: "Dostop dovoljen.",
    user: req.user,
  });
});

app.get("/api/weather", authMiddleware, (req, res) => {
  const db = readDb();
  return res.json(db.weatherFavorites);
});

app.get("/api/weather/favorites", authMiddleware, (req, res) => {
  const db = readDb();
  const favorites = db.weatherFavorites
    .filter((item) => item.favorite)
    .map(({ city, country, temperatureC, condition }) => ({
      city,
      country,
      temperatureC,
      condition,
    }));

  return res.json({
    count: favorites.length,
    data: favorites,
  });
});

app.post("/api/weather", authMiddleware, (req, res) => {
  const { city, country, temperatureC, condition, favorite } = req.body;

  if (!city || !country || temperatureC === undefined || !condition) {
    return res.status(400).json({
      message: "Polja city, country, temperatureC in condition so obvezna.",
    });
  }

  const db = readDb();
  const newEntry = {
    id: db.weatherFavorites.length + 1,
    city,
    country,
    temperatureC,
    condition,
    favorite: Boolean(favorite),
    createdBy: req.user.email,
  };

  db.weatherFavorites.push(newEntry);
  writeDb(db);

  return res.status(201).json({
    message: "Vremenski zapis ustvarjen.",
    data: newEntry,
  });
});

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
