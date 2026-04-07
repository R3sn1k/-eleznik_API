const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../../../middleware/auth");
const { jwtSecret } = require("../../../config");
const { readDb, writeDb } = require("../../../db");
const asyncHandler = require("../../../utils/asyncHandler");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "CREATE endpointi za Vreme API.",
    endpoints: {
      register: "POST /API/CREATE/register",
      login: "POST /API/CREATE/login",
      createWeather: "POST /API/CREATE/weather",
      addFavorite: "POST /API/CREATE/favorites",
    },
  });
});

router.post("/register", asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Polja username, email in password so obvezna.",
    });
  }

  const db = await readDb();
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
    id: db.users.length ? Math.max(...db.users.map((user) => user.id)) + 1 : 1,
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  await writeDb(db);

  return res.status(201).json({
    message: "Registracija uspesna.",
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    },
  });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Polji email in password sta obvezni.",
    });
  }

  const db = await readDb();
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
}));

router.post("/weather", authMiddleware, asyncHandler(async (req, res) => {
  const { city, country, temperatureC, condition } = req.body;

  if (!city || !country || temperatureC === undefined || !condition) {
    return res.status(400).json({
      message: "Polja city, country, temperatureC in condition so obvezna.",
    });
  }

  const db = await readDb();
  const newEntry = {
    id: db.weatherFavorites.length
      ? Math.max(...db.weatherFavorites.map((item) => item.id)) + 1
      : 1,
    city,
    country,
    temperatureC,
    condition,
    createdBy: req.user.email,
  };

  db.weatherFavorites.push(newEntry);
  await writeDb(db);

  return res.status(201).json({
    message: "Vremenski zapis ustvarjen.",
    data: newEntry,
  });
}));

router.post("/favorites", authMiddleware, asyncHandler(async (req, res) => {
  const { weatherId } = req.body;
  const parsedWeatherId = Number(weatherId);

  if (Number.isNaN(parsedWeatherId)) {
    return res.status(400).json({
      message: "Polje weatherId je obvezno in mora biti stevilo.",
    });
  }

  const db = await readDb();
  const weatherEntry = db.weatherFavorites.find((item) => item.id === parsedWeatherId);

  if (!weatherEntry) {
    return res.status(404).json({
      message: "Vremenski zapis ni bil najden.",
    });
  }

  const existingFavorite = db.favorites.find(
    (item) =>
      item.userEmail === req.user.email && item.weatherId === parsedWeatherId
  );

  if (existingFavorite) {
    return res.status(409).json({
      message: "Ta kraj je ze med priljubljenimi.",
      data: existingFavorite,
    });
  }

  const newFavorite = {
    id: db.favorites.length ? Math.max(...db.favorites.map((item) => item.id)) + 1 : 1,
    userEmail: req.user.email,
    weatherId: parsedWeatherId,
    createdAt: new Date().toISOString(),
  };

  db.favorites.push(newFavorite);
  await writeDb(db);

  return res.status(201).json({
    message: "Kraj dodan med priljubljene.",
    data: newFavorite,
  });
}));

module.exports = router;
