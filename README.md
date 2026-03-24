# Zeleznik API

Enostaven primer projekta za nalogo s `Postman` in `JWT` tokeni.

## Naloga, ki jo pokriva projekt

- prikaz obstojecega API-ja
- `register`
- `login`
- JWT zascita
- prikaz samo dolocenih podatkov iz API-ja

Primer podatkov je narejen na temi vremena:

- `GET /api/weather` vrne vse vremenske zapise
- `GET /api/weather/favorites` vrne samo priljubljene kraje in samo izbrana polja

## Zagon

```bash
npm install
npm start
```

API tece na `http://localhost:3000`.

Ce je port `3000` zaseden, zazeni:

```bash
$env:PORT=3005
npm start
```

## Endpointi

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/weather`
- `GET /api/weather/favorites`
- `POST /api/weather`

## Kako pokazes nalogo v Postmanu

### 1. Uvozi kolekcijo

V mapi projekta je datoteka `postman/Zeleznik_API.postman_collection.json`.

V Postmanu klikni:

`Import -> File -> izberi collection json`

### 2. Pozeni streznik

V terminalu:

```bash
npm start
```

### 3. Naredi register

V kolekciji odpri `Register` in poslji request.

Primer body:

```json
{
  "username": "janez",
  "email": "janez@test.com",
  "password": "geslo123"
}
```

### 4. Naredi login

Odpri `Login` in poslji request:

```json
{
  "email": "janez@test.com",
  "password": "geslo123"
}
```

Odgovor vrne `token`.

### 5. Uporabi JWT token

Ta token das v header:

```text
Authorization: Bearer TVOJ_TOKEN
```

S tem potem delujeta:

- `GET /api/users/me`
- `GET /api/weather`
- `GET /api/weather/favorites`
- `POST /api/weather`

### 6. Pokazi selektivne podatke

Najbolj pomemben endpoint za zadnji del naloge je:

`GET /api/weather/favorites`

Ta endpoint:

- vrne samo kraje, kjer je `favorite = true`
- ne vrne vseh polj iz baze
- vrne samo `city`, `country`, `temperatureC`, `condition`

To je tocno primer "prikazi samo dolocene podatke".

## Kaj je JWT

`JWT` pomeni `JSON Web Token`.

Uporaba v tem projektu:

1. uporabnik se registrira
2. uporabnik se prijavi
3. server vrne token
4. ta token posljes pri zascitenih requestih
5. server preveri, ali je token veljaven

## Datoteke

- `src/server.js` glavni API
- `src/middleware/auth.js` preverjanje JWT tokena
- `src/db.js` branje in pisanje lokalne baze
- `data/db.json` testni podatki
- `postman/Zeleznik_API.postman_collection.json` Postman kolekcija
