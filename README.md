# 🎯 Système de Quiz Sécurisé Webflow

Ce système automatise la validation des réponses du quiz en générant des hash cryptographiques, empêchant les utilisateurs de voir les bonnes réponses dans le code source.

## 🚀 Installation

### 1. Prérequis

- Node.js installé (https://nodejs.org)
- Compte GitHub
- Accès API Webflow

### 2. Setup Initial

1. **Cloner ou créer ce repository sur GitHub**

2. **Installer Node.js localement** (si pas déjà fait)
   - Télécharge depuis https://nodejs.org
   - Version LTS recommandée

3. **Installer les dépendances**
   ```bash
   npm install
   ```

4. **Configurer les variables d'environnement**
   - Copie `.env.example` vers `.env`
   - Remplis ta clé API Webflow
   - Remplis ton Site ID

5. **Tester localement**
   ```bash
   npm run sync
   ```
   
   Tu devrais voir un fichier `answers-hash.json` créé

### 3. Configuration GitHub Actions

1. **Ajouter les secrets GitHub**
   - Va dans ton repo → Settings → Secrets and variables → Actions
   - Ajoute ces secrets :
     - `WEBFLOW_API_TOKEN` : Ta clé API Webflow
     - `WEBFLOW_SITE_ID` : L'ID de ton site

2. **Activer GitHub Pages** (pour héberger le JSON)
   - Settings → Pages
   - Source : Deploy from a branch
   - Branch : main / root
   - Save

3. **Premier sync manuel**
   - Actions → Sync Quiz Answers → Run workflow

## 🔄 Utilisation

### Automatique
Le script tourne automatiquement tous les jours à 3h du matin UTC.

### Manuel
Dans l'onglet Actions de GitHub, clique sur "Run workflow" quand tu veux.

## 📊 Structure des données

Le fichier `answers-hash.json` généré contient :

```json
{
  "generated": "2025-11-30T12:00:00.000Z",
  "totalQuestions": 150,
  "answers": {
    "question-id-1": {
      "hash": "a9f2b8c4d1e3",
      "questionName": "Quelle est la capitale ?"
    }
  }
}
```

## 🔐 Sécurité

- Les hash sont générés avec SHA-256
- Impossible de retrouver la réponse depuis le hash
- Le fichier JSON ne contient aucune information sensible

## 🛠️ Dépannage

### Le script ne fonctionne pas
- Vérifie que ton API token est valide
- Vérifie les permissions CMS (Read collections + Read items)
- Regarde les logs dans Actions

### Aucune question n'est traitée
- Vérifie que les questions ont une "Bonne réponse" cochée dans le CMS
- Vérifie les Collection IDs dans `.env`

## 📞 Support

Pour toute question, vérifie d'abord les logs dans l'onglet Actions de GitHub.
```