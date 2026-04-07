const {
  sanityProjectId,
  sanityDataset,
  sanityToken,
  sanityApiVersion,
} = require("./config");

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

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sanityToken}`,
  };
}

function buildQueryUrl(query) {
  const encodedQuery = encodeURIComponent(query);
  return `https://${sanityProjectId}.api.sanity.io/v${sanityApiVersion}/data/query/${sanityDataset}?query=${encodedQuery}`;
}

function buildMutateUrl() {
  return `https://${sanityProjectId}.api.sanity.io/v${sanityApiVersion}/data/mutate/${sanityDataset}`;
}

function assertSanityConfig() {
  if (!sanityProjectId || !sanityDataset || !sanityToken) {
    throw new Error(
      "Sanity konfiguracija manjka. Nastavi SANITY_PROJECT_ID, SANITY_DATASET in SANITY_TOKEN."
    );
  }
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function mapUser(doc) {
  return {
    id: normalizeNumber(doc.localId),
    username: doc.username,
    email: doc.email,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
  };
}

function mapWeather(doc) {
  return {
    id: normalizeNumber(doc.localId),
    city: doc.city,
    country: doc.country,
    temperatureC: doc.temperatureC,
    condition: doc.condition,
    favorite: Boolean(doc.favorite),
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
    updatedAt: doc.updatedAt,
  };
}

function mapFavorite(doc) {
  return {
    id: normalizeNumber(doc.localId),
    userEmail: doc.userEmail,
    weatherId: normalizeNumber(doc.weatherId),
    createdAt: doc.createdAt,
  };
}

function sortById(a, b) {
  return a.id - b.id;
}

async function sanityQuery(query) {
  assertSanityConfig();

  const response = await fetch(buildQueryUrl(query), {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sanity query failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  return json.result;
}

async function sanityMutate(mutations) {
  assertSanityConfig();

  const response = await fetch(buildMutateUrl(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ mutations }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sanity mutate failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function loadRawDocs() {
  const [users, weatherFavorites, favorites] = await Promise.all([
    sanityQuery(`*[_type == "user"]{
      _id,
      localId,
      username,
      email,
      passwordHash,
      createdAt
    }`),
    sanityQuery(`*[_type == "weatherEntry"]{
      _id,
      localId,
      city,
      country,
      temperatureC,
      condition,
      favorite,
      createdBy,
      updatedBy,
      updatedAt
    }`),
    sanityQuery(`*[_type == "favorite"]{
      _id,
      localId,
      userEmail,
      weatherId,
      createdAt
    }`),
  ]);

  return { users, weatherFavorites, favorites };
}

function buildDocId(type, localId) {
  return `${type}-${localId}`;
}

function buildUserDoc(user, existingDoc) {
  return {
    _id: existingDoc?._id || buildDocId("user", user.id),
    _type: "user",
    localId: user.id,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
  };
}

function buildWeatherDoc(weather, existingDoc) {
  return {
    _id: existingDoc?._id || buildDocId("weatherEntry", weather.id),
    _type: "weatherEntry",
    localId: weather.id,
    city: weather.city,
    country: weather.country,
    temperatureC: weather.temperatureC,
    condition: weather.condition,
    favorite: Boolean(weather.favorite),
    createdBy: weather.createdBy,
    updatedBy: weather.updatedBy,
    updatedAt: weather.updatedAt,
  };
}

function buildFavoriteDoc(favorite, existingDoc) {
  return {
    _id: existingDoc?._id || buildDocId("favorite", favorite.id),
    _type: "favorite",
    localId: favorite.id,
    userEmail: favorite.userEmail,
    weatherId: favorite.weatherId,
    createdAt: favorite.createdAt,
  };
}

async function ensureDb() {
  const { weatherFavorites } = await loadRawDocs();

  if (weatherFavorites.length > 0) {
    return;
  }

  const seedMutations = defaultData.weatherFavorites.map((entry) => ({
    createIfNotExists: buildWeatherDoc(entry),
  }));

  await sanityMutate(seedMutations);
}

async function readDb() {
  await ensureDb();
  const rawDocs = await loadRawDocs();

  return {
    users: rawDocs.users.map(mapUser).sort(sortById),
    weatherFavorites: rawDocs.weatherFavorites.map(mapWeather).sort(sortById),
    favorites: rawDocs.favorites.map(mapFavorite).sort(sortById),
  };
}

async function syncCollection(currentDocs, desiredItems, buildDoc) {
  const currentById = new Map(
    currentDocs.map((doc) => [normalizeNumber(doc.localId), doc])
  );
  const desiredIds = new Set(desiredItems.map((item) => normalizeNumber(item.id)));
  const mutations = [];

  for (const item of desiredItems) {
    const localId = normalizeNumber(item.id);
    const existingDoc = currentById.get(localId);

    mutations.push({
      createOrReplace: buildDoc(item, existingDoc),
    });
  }

  for (const doc of currentDocs) {
    const localId = normalizeNumber(doc.localId);

    if (!desiredIds.has(localId)) {
      mutations.push({
        delete: {
          id: doc._id,
        },
      });
    }
  }

  return mutations;
}

async function writeDb(data) {
  await ensureDb();
  const currentDocs = await loadRawDocs();
  const mutations = [
    ...(await syncCollection(currentDocs.users, data.users, buildUserDoc)),
    ...(await syncCollection(
      currentDocs.weatherFavorites,
      data.weatherFavorites,
      buildWeatherDoc
    )),
    ...(await syncCollection(currentDocs.favorites, data.favorites, buildFavoriteDoc)),
  ];

  if (mutations.length === 0) {
    return;
  }

  await sanityMutate(mutations);
}

module.exports = {
  ensureDb,
  readDb,
  writeDb,
};
