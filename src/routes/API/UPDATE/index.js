const express = require("express");
const authMiddleware = require("../../../middleware/auth");
const { readDb, writeDb } = require("../../../db");
const asyncHandler = require("../../../utils/asyncHandler");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "UPDATE endpointi za Vreme API.",
    endpoints: {
      updateWeather: "PUT /API/UPDATE/weather/:id",
    },
  });
});

router.put("/weather/:id", authMiddleware, asyncHandler(async (req, res) => {
  const weatherId = Number(req.params.id);
  const { city, country, temperatureC, condition, favorite } = req.body;

  if (Number.isNaN(weatherId)) {
    return res.status(400).json({
      message: "ID mora biti stevilo.",
    });
  }

  if (!city || !country || temperatureC === undefined || !condition) {
    return res.status(400).json({
      message: "Polja city, country, temperatureC in condition so obvezna.",
    });
  }

  const db = await readDb();
  const entryIndex = db.weatherFavorites.findIndex((item) => item.id === weatherId);

  if (entryIndex === -1) {
    return res.status(404).json({
      message: "Vremenski zapis ni bil najden.",
    });
  }

  const updatedEntry = {
    ...db.weatherFavorites[entryIndex],
    city,
    country,
    temperatureC,
    condition,
    favorite: Boolean(favorite),
    updatedBy: req.user.email,
    updatedAt: new Date().toISOString(),
  };

  db.weatherFavorites[entryIndex] = updatedEntry;
  await writeDb(db);

  return res.json({
    message: "Vremenski zapis posodobljen.",
    data: updatedEntry,
  });
}));

module.exports = router;
