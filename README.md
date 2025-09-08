# LEGOMIL - LEGO Set Tracker

Jednostavan web aplikacija za praćenje LEGO setova koristeći Rebrickable API.

## Funkcionalnosti

- Pregled svih LEGO setova
- Dodavanje novih setova preko set broj
- Brisanje postojećih setova
- Sortiranje setova po godini (najnoviji prvi)
- Lokalno čuvanje podataka u markdown formatu

## Tehnologije

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript
- **API**: Rebrickable API v3
- **Storage**: Lokalni fajl sistem (markdown fajlovi)

## Setup

1. **Kloniraj repo**
   ```bash
   git clone <repo-url>
   cd legomil
   ```

2. **Instaliraj dependencies**
   ```bash
   npm install
   ```

3. **Kreiraj .env fajl**
   ```bash
   touch .env
   ```
   
   Dodaj svoj Rebrickable API key:
   ```
   REBRICKABLE_API_KEY=tvoj_api_key_ovde
   ```

4. **Pokreni server**
   ```bash
   npm start
   ```

5. **Otvori u browser-u**
   ```
   http://localhost:3005
   ```

## API Endpoints

- `GET /sets` - Vraća sve setove
- `POST /addSet/:number` - Dodaje novi set
- `DELETE /deleteSet/:number` - Briše set

## Struktura projekta

```
legomil/
├── server.js          # Express server
├── package.json       # Dependencies
├── .env               # Environment variables (ignored)
├── .gitignore         # Git ignore rules
├── public/            # Static frontend fajlovi
└── data/              # LEGO set podatci (lokalno)
    └── .gitkeep       # Održava folder strukturu
```

## Napomene

- Data folder se ignorise u git-u osim .gitkeep fajla
- Setovi se čuvaju kao markdown fajlovi sa YAML front matter
- Potreban je Rebrickable API key za pristup podacima o setovima