const fs = require("fs");
const path = require("path");
const { dbPath } = require("./config");

const defaultData = {
  users: [],
  weatherFavorites: [
    {
      id: 1,
      city: "Ljubljana",
      country: "Slovenia",
      temperatureC: 18,
      condition: "Cloudy",
    },
    {
      id: 2,
      city: "Maribor",
      country: "Slovenia",
      temperatureC: 17,
      condition: "Sunny",
    },
    {
      id: 3,
      city: "Koper",
      country: "Slovenia",
      temperatureC: 22,
      condition: "Sunny",
    },
    {
      id: 4,
      city: "Celje",
      country: "Slovenia",
      temperatureC: 16,
      condition: "Rain",
    }
  ],
  favorites: [],
};

function ensureDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    return;
  }

  const raw = fs.readFileSync(dbPath, "utf8");
  const currentData = JSON.parse(raw);
  let changed = false;

  if (!Array.isArray(currentData.users)) {
    currentData.users = [];
    changed = true;
  }

  if (!Array.isArray(currentData.weatherFavorites)) {
    currentData.weatherFavorites = defaultData.weatherFavorites;
    changed = true;
  }

  if (!Array.isArray(currentData.favorites)) {
    currentData.favorites = [];
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(dbPath, JSON.stringify(currentData, null, 2));
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(raw);
}

function writeDb(data) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
  ensureDb,
  readDb,
  writeDb,
};
