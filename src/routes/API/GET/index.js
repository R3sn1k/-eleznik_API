const express = require("express");
const authMiddleware = require("../../../middleware/auth");
const { readDb } = require("../../../db");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "GET endpointi za Vreme API.",
    endpoints: {
      home: "GET /API/GET/home",
      profile: "GET /API/GET/profile",
      weatherAll: "GET /API/GET/weather",
      weatherById: "GET /API/GET/weather/:id",
      weatherFavorites: "GET /API/GET/weather/favorites",
    },
  });
});

router.get("/home", (req, res) => {
  res.json({
    message: "Dobrodosel v GET delu projekta.",
    info: "Tukaj so vsi bralni endpointi za uporabnike in vreme.",
  });
});

router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Dostop dovoljen.",
    user: req.user,
  });
});

router.get("/weather", authMiddleware, (req, res) => {
  const db = readDb();
  res.json({
    count: db.weatherFavorites.length,
    data: db.weatherFavorites,
  });
});

router.get("/weather/favorites", authMiddleware, (req, res) => {
  const db = readDb();
  const favorites = db.weatherFavorites
    .filter((item) => item.favorite)
    .map(({ id, city, country, temperatureC, condition }) => ({
      id,
      city,
      country,
      temperatureC,
      condition,
    }));

  res.json({
    count: favorites.length,
    data: favorites,
  });
});

router.get("/weather/:id", authMiddleware, (req, res) => {
  const weatherId = Number(req.params.id);

  if (Number.isNaN(weatherId)) {
    return res.status(400).json({
      message: "ID mora biti stevilo.",
    });
  }

  const db = readDb();
  const entry = db.weatherFavorites.find((item) => item.id === weatherId);

  if (!entry) {
    return res.status(404).json({
      message: "Vremenski zapis ni bil najden.",
    });
  }

  return res.json(entry);
});

module.exports = router;
