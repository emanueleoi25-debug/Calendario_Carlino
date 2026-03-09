## Sistema Multi-Calendario Aziendale

Applicazione web multi-utente per la gestione di calendari aziendali e personali, containerizzata con Docker (frontend React, backend Node/Express, database MySQL).

### Struttura progetto

- `frontend`: applicazione React.js con Tailwind CSS
- `backend`: API Node.js/Express.js con autenticazione JWT, gestione calendari/eventi, notifiche email
- `docker-compose.yml`: orchestrazione servizi (frontend, backend, MySQL)
- `.env.example`: esempio di configurazione variabili ambiente

### Prerequisiti

- Docker e Docker Compose installati

### Configurazione

1. Copiare il file `.env.example` in `.env` alla radice del progetto:

   ```bash
   cp .env.example .env
   ```

2. Personalizzare le variabili di ambiente nel file `.env`:

   - credenziali MySQL (`MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`)
   - segreto JWT (`JWT_SECRET`)
   - configurazione SMTP per Nodemailer (`SMTP_*`)

### Avvio con Docker

Da root del progetto:

```bash
docker compose up --build
```

Servizi esposti:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- MySQL: `localhost:3306`

### Credenziali admin di default

Al primo avvio verrà creato automaticamente un utente amministratore di default (seed DB).  
Valori predefiniti (modificabili successivamente nella configurazione/seed):

- **username**: `admin`
- **email**: `admin@example.com`
- **password**: `admin123`

### Documentazione API

Le API REST del backend saranno documentate tramite endpoint dedicato:

- `GET /api/docs` – documentazione dei principali endpoint (auth, calendari, eventi, amministrazione).

### Setup sviluppo (senza Docker) – opzionale

Verrà aggiunta in seguito una guida per l'esecuzione separata di frontend e backend in ambiente di sviluppo locale.
