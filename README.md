# PZRQUETPLUS

## SIGNAL — Agent de dossier créatrices

Outil de recherche documentaire sur des créatrices Instagram/TikTok : lit des **sources publiques uniquement** (via l'outil `web_search` de Claude) et remplit une fiche structurée (parcours, persona, formats, monétisation, leviers). Les champs introuvables sont marqués « non vérifié », jamais inventés.

**Portée : uniquement des informations déjà publiques.** Cet outil n'a pas et ne peut pas avoir d'accès aux données privées d'Instagram, Google ou Snapchat (comptes privés, analytics internes, API non publiques) — il compile ce que `web_search` trouve déjà indexé publiquement.

### Installation

```bash
npm install
cp .env.example .env   # renseigne ANTHROPIC_API_KEY
npm start
```

Puis ouvre `http://localhost:3000`.

### Architecture

- `server.js` : backend Express qui détient la clé API côté serveur et appelle l'API Anthropic (`claude-opus-4-8` + outil `web_search`). La clé n'est **jamais** exposée au navigateur.
- `public/index.html` : interface — appelle `/api/research`, jamais directement `api.anthropic.com`.
