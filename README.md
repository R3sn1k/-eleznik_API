# Zeleznik API

API je preurejen tako, da je razdeljen po mapah in URL-jih:

- `GET`
- `CREATE`
- `UPDATE`
- `DELETE`

Primer strukture URL-jev:

- `http://localhost:3000/API/GET`
- `http://localhost:3000/API/CREATE`
- `http://localhost:3000/API/UPDATE`
- `http://localhost:3000/API/DELETE`

## Zagon

```bash
npm install
npm start
```

Ce je port `3000` zaseden:

```bash
$env:PORT=3005
npm start
```

## Endpointi

### GET

- `GET /API/GET`
- `GET /API/GET/home`
- `GET /API/GET/profile`
- `GET /API/GET/weather`
- `GET /API/GET/weather/:id`
- `GET /API/GET/weather/favorites`

### CREATE

- `POST /API/CREATE/register`
- `POST /API/CREATE/login`
- `POST /API/CREATE/weather`

### UPDATE

- `PUT /API/UPDATE/weather/:id`

### DELETE

- `DELETE /API/DELETE/weather/:id`

## Kaj pokazes v Postmanu

1. `POST /API/CREATE/register`
2. `POST /API/CREATE/login`
3. kopiras `token`
4. `GET /API/GET/profile`
5. `GET /API/GET/weather`
6. `GET /API/GET/weather/favorites`
7. `POST /API/CREATE/weather`
8. `PUT /API/UPDATE/weather/1`
9. `DELETE /API/DELETE/weather/1`

## Body primeri

### Register

```json
{
  "username": "janez",
  "email": "janez.nov@test.com",
  "password": "geslo123"
}
```

### Login

```json
{
  "email": "janez.nov@test.com",
  "password": "geslo123"
}
```

### Create weather

```json
{
  "city": "Ptuj",
  "country": "Slovenia",
  "temperatureC": 21,
  "condition": "Sunny",
  "favorite": true
}
```

### Update weather

```json
{
  "city": "Novo mesto",
  "country": "Slovenia",
  "temperatureC": 19,
  "condition": "Windy",
  "favorite": false
}
```

## Mape

- `src/routes/API/GET`
- `src/routes/API/CREATE`
- `src/routes/API/UPDATE`
- `src/routes/API/DELETE`
- `postman/Zeleznik_API.postman_collection.json`
