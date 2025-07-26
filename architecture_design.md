# Architektura aplikace Kolo pohody

## 1. Celková architektura

Aplikace bude postavena na moderní webové architektuře s oddělením frontend a backend komponent:

- **Frontend:** React aplikace s responzivním designem
- **Backend:** Flask API server s RESTful endpointy
- **Databáze:** SQLite pro jednoduchost (možnost rozšíření na PostgreSQL)
- **Autentizace:** OAuth 2.0 integrace s Google, Apple, Microsoft
- **Hosting:** Nasazení přes Manus deployment služby

## 2. Technologický stack

### Frontend
- **React 18+** - Moderní UI framework
- **React Router** - Navigace mezi stránkami
- **Styled Components** nebo **CSS Modules** - Stylování
- **Axios** - HTTP klient pro komunikaci s API
- **Chart.js** nebo **Recharts** - Vizualizace dat pro wellness wheel
- **React Hook Form** - Správa formulářů
- **Date-fns** - Práce s datumy

### Backend
- **Flask** - Python web framework
- **Flask-CORS** - Cross-origin requests
- **Flask-SQLAlchemy** - ORM pro databázi
- **Flask-JWT-Extended** - JWT token management
- **Authlib** - OAuth 2.0 implementace
- **ReportLab** nebo **WeasyPrint** - PDF generování
- **OpenAI API** - AI generátor inspirací

### Databáze
- **SQLite** (development/production) - Jednoduchost nasazení
- Možnost migrace na **PostgreSQL** pro škálování

## 3. Datový model

### Tabulka Users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'google', 'apple', 'microsoft'
    provider_id VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabulka Wellness Categories
```sql
CREATE TABLE wellness_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7), -- hex color
    icon VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

### Tabulka Wellness Entries
```sql
CREATE TABLE wellness_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    note TEXT,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES wellness_categories (id) ON DELETE CASCADE,
    UNIQUE(user_id, category_id, entry_date)
);
```

### Tabulka Journal Entries (Drobné radosti)
```sql
CREATE TABLE journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    entry_date DATE NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    tags VARCHAR(500), -- JSON array of tags
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

### Tabulka Reminders
```sql
CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    time_of_day TIME, -- HH:MM format
    days_of_week VARCHAR(20), -- JSON array for weekly reminders
    is_active BOOLEAN DEFAULT TRUE,
    last_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

### Tabulka AI Inspirations
```sql
CREATE TABLE ai_inspirations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'quote', 'playlist', 'exercise', 'reflection'
    content TEXT NOT NULL,
    metadata TEXT, -- JSON for additional data
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

## 4. API Endpointy

### Autentizace
- `POST /auth/login/{provider}` - OAuth přihlášení
- `POST /auth/refresh` - Obnovení JWT tokenu
- `POST /auth/logout` - Odhlášení
- `GET /auth/me` - Informace o aktuálním uživateli

### Wellness Wheel
- `GET /api/categories` - Seznam kategorií uživatele
- `POST /api/categories` - Vytvoření nové kategorie
- `PUT /api/categories/{id}` - Úprava kategorie
- `DELETE /api/categories/{id}` - Smazání kategorie
- `GET /api/entries` - Wellness záznamy (s filtry)
- `POST /api/entries` - Vytvoření nového záznamu
- `PUT /api/entries/{id}` - Úprava záznamu
- `DELETE /api/entries/{id}` - Smazání záznamu

### Journal (Drobné radosti)
- `GET /api/journal` - Seznam zápisků
- `POST /api/journal` - Nový zápis
- `PUT /api/journal/{id}` - Úprava zápisu
- `DELETE /api/journal/{id}` - Smazání zápisu
- `PUT /api/journal/{id}/privacy` - Změna soukromí

### Připomenutí
- `GET /api/reminders` - Seznam připomenutí
- `POST /api/reminders` - Nové připomenutí
- `PUT /api/reminders/{id}` - Úprava připomenutí
- `DELETE /api/reminders/{id}` - Smazání připomenutí

### Export a AI
- `POST /api/export/pdf` - Export do PDF
- `POST /api/ai/inspiration` - Generování inspirace
- `GET /api/ai/inspirations` - Historie inspirací
- `PUT /api/ai/inspirations/{id}/favorite` - Označení jako oblíbené

## 5. Bezpečnost

### Autentizace a autorizace
- OAuth 2.0 pro přihlášení přes externí providery
- JWT tokeny pro session management
- Refresh tokeny pro dlouhodobé přihlášení
- CORS konfigurace pro bezpečnou komunikaci

### Ochrana dat
- Všechny API endpointy vyžadují autentizaci
- Uživatelé mají přístup pouze ke svým datům
- Možnost označit záznamy jako soukromé
- HTTPS pro všechnu komunikaci

### Validace
- Input validace na frontend i backend
- SQL injection ochrana přes ORM
- Rate limiting pro API endpointy
- Sanitizace uživatelského obsahu

## 6. Výkon a škálovatelnost

### Optimalizace
- Lazy loading komponent v Reactu
- Paginace pro velké datasety
- Caching často používaných dat
- Optimalizované databázové dotazy

### Monitoring
- Error logging a reporting
- Performance monitoring
- User analytics (anonymizované)

Tato architektura poskytuje solidní základ pro škálovatelnou a bezpečnou wellness aplikaci s moderními technologiemi a best practices.

