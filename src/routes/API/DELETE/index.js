const express = require("express");
const authMiddleware = require("../../../middleware/auth");
const { readDb, writeDb } = require("../../../db");
const asyncHandler = require("../../../utils/asyncHandler");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "DELETE endpointi za Vreme API.",
    endpoints: {
      deleteWeather: "DELETE /API/DELETE/weather/:id",
      deleteFavorite: "DELETE /API/DELETE/favorites/:id",
    },
  });
});

router.delete("/weather/:id", authMiddleware, asyncHandler(async (req, res) => {
  const weatherId = Number(req.params.id);

  if (Number.isNaN(weatherId)) {
    return res.status(400).json({
      message: "ID mora biti stevilo.",
    });
  }

  const db = await readDb();
  const entryIndex = db.weatherFavorites.findIndex((item) => item.id === weatherId);

  if (entryIndex === -1) {
    return res.status(404).json({
      message: "Vremenski zapis ni bil najden.",
    });
  }

  const [deletedEntry] = db.weatherFavorites.splice(entryIndex, 1);
  db.favorites = db.favorites.filter((item) => item.weatherId !== weatherId);
  await writeDb(db);

  return res.json({
    message: "Vremenski zapis izbrisan.",
    data: deletedEntry,
  });
}));

router.delete("/favorites/:id", authMiddleware, asyncHandler(async (req, res) => {
  const favoriteId = Number(req.params.id);

  if (Number.isNaN(favoriteId)) {
    return res.status(400).json({
      message: "ID mora biti stevilo.",
    });
  }

  const db = await readDb();
  const favoriteIndex = db.favorites.findIndex(
    (item) => item.id === favoriteId && item.userEmail === req.user.email
  );

  if (favoriteIndex === -1) {
    return res.status(404).json({
      message: "Priljubljeni kraj ni bil najden.",
    });
  }

  const [deletedFavorite] = db.favorites.splice(favoriteIndex, 1);
  await writeDb(db);

  return res.json({
    message: "Priljubljeni kraj odstranjen.",
    data: deletedFavorite,
  });
}));

module.exports = router;
