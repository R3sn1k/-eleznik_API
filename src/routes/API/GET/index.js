const express = require("express");
const authMiddleware = require("../../../middleware/auth");
const { readDb } = require("../../../db");
const asyncHandler = require("../../../utils/asyncHandler");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "GET endpointi za Vreme API.",
    endpoints: {
      home: "GET /API/GET/home",
      profile: "GET /API/GET/profile",
      weatherAll: "GET /API/GET/weather",
      weatherById: "GET /API/GET/weather/:id",
      weatherFavorites: "GET /API/GET/favorites",
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

router.get("/weather", authMiddleware, asyncHandler(async (req, res) => {
  const db = await readDb();
  const userFavorites = new Set(
    db.favorites
      .filter((item) => item.userEmail === req.user.email)
      .map((item) => item.weatherId)
  );

  const weatherData = db.weatherFavorites.map((item) => ({
    ...item,
    isFavorite: userFavorites.has(item.id),
  }));

  res.json({
    count: weatherData.length,
    data: weatherData,
  });
}));

router.get("/favorites", authMiddleware, asyncHandler(async (req, res) => {
  const db = await readDb();
  const favorites = db.favorites
    .filter((item) => item.userEmail === req.user.email)
    .map((favorite) => {
      const weatherEntry = db.weatherFavorites.find(
        (item) => item.id === favorite.weatherId
      );

      if (!weatherEntry) {
        return null;
      }

      return {
        favoriteId: favorite.id,
        weatherId: weatherEntry.id,
        city: weatherEntry.city,
        country: weatherEntry.country,
        temperatureC: weatherEntry.temperatureC,
        condition: weatherEntry.condition,
      };
    })
    .filter(Boolean);

  res.json({
    count: favorites.length,
    data: favorites,
  });
}));

router.get("/weather/:id", authMiddleware, asyncHandler(async (req, res) => {
  const weatherId = Number(req.params.id);

  if (Number.isNaN(weatherId)) {
    return res.status(400).json({
      message: "ID mora biti stevilo.",
    });
  }

  const db = await readDb();
  const entry = db.weatherFavorites.find((item) => item.id === weatherId);

  if (!entry) {
    return res.status(404).json({
      message: "Vremenski zapis ni bil najden.",
    });
  }

  const favorite = db.favorites.find(
    (item) => item.userEmail === req.user.email && item.weatherId === entry.id
  );

  return res.json({
    ...entry,
    isFavorite: Boolean(favorite),
    favoriteId: favorite ? favorite.id : null,
  });
}));

module.exports = router;
