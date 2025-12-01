/**
 * 🎯 WEBFLOW QUIZ SYNC SCRIPT
 * 
 * Ce script lit les questions du CMS Webflow,
 * identifie les bonnes réponses, génère des hash sécurisés,
 * et crée un fichier JSON pour validation côté client.
 */

require('dotenv').config();
const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    apiToken: process.env.WEBFLOW_API_TOKEN,
    siteId: process.env.WEBFLOW_SITE_ID,
    collections: {
        questions: process.env.COLLECTION_QUESTIONS,
        reponses: process.env.COLLECTION_REPONSES,
        exercices: process.env.COLLECTION_EXERCICES
    },
    apiBase: 'https://api.webflow.com/v2',
    outputFile: 'answers-hash.json'
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Génère un hash sécurisé à partir d'une chaîne
 */
function generateHash(input) {
    return crypto
        .createHash('sha256')
        .update(input + process.env.WEBFLOW_API_TOKEN) // Salt avec l'API token
        .digest('hex')
        .substring(0, 12); // Garder seulement 12 caractères
}

/**
 * Appel API Webflow avec gestion d'erreurs
 */
async function webflowAPI(endpoint) {
    const url = `${CONFIG.apiBase}${endpoint}`;

    console.log(`📡 Appel API: ${endpoint}`);

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${CONFIG.apiToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API Webflow: ${response.status} ${response.statusText}\nDétails: ${errorText}`);
    }

    return await response.json();
}

/**
 * Récupère tous les items d'une collection (avec pagination)
 */
async function getAllCollectionItems(collectionId) {
    let allItems = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
        const data = await webflowAPI(`/collections/${collectionId}/items?limit=${limit}&offset=${offset}`);

        allItems = allItems.concat(data.items);

        // Vérifier s'il y a plus d'items
        if (data.items.length < limit) {
            hasMore = false;
        } else {
            offset += limit;
        }
    }

    return allItems;
}

// ============================================
// LOGIQUE PRINCIPALE
// ============================================

async function syncQuizAnswers() {
    console.log('🚀 Démarrage de la synchronisation...\n');

    try {
        // 1. RÉCUPÉRER TOUTES LES QUESTIONS
        console.log('📚 Récupération des questions...');
        const questions = await getAllCollectionItems(CONFIG.collections.questions);
        console.log(`✅ ${questions.length} questions trouvées\n`);

        // 2. RÉCUPÉRER TOUTES LES RÉPONSES
        console.log('💡 Récupération des réponses...');
        const reponses = await getAllCollectionItems(CONFIG.collections.reponses);
        console.log(`✅ ${reponses.length} réponses trouvées\n`);

        // 3. CRÉER UN MAP DES RÉPONSES PAR ID
        const reponsesMap = {};
        reponses.forEach(reponse => {
            reponsesMap[reponse.id] = reponse;
        });

        // 4. GÉNÉRER LES HASH POUR CHAQUE QUESTION
        console.log('🔐 Génération des hash de validation...\n');
        const answersHash = {};
        let processedCount = 0;

        for (const question of questions) {
            const questionId = question.id;
            const questionData = question.fieldData;
            const questionName = questionData['nom-interne-de-la-question'] || questionData.name || 'Sans nom';

            // Récupérer la référence de la bonne réponse
            const bonneReponseRef = questionData['bonne-reponse'];

            if (!bonneReponseRef) {
                console.log(`⚠️  Question "${questionName}" : Aucune bonne réponse définie`);
                continue;
            }

            // Récupérer l'objet réponse complet
            const bonneReponse = reponsesMap[bonneReponseRef];

            if (!bonneReponse) {
                console.log(`⚠️  Question "${questionName}" : Réponse introuvable`);
                continue;
            }

            // Récupérer le texte de la réponse
            const bonneReponseData = bonneReponse.fieldData;
            const reponseText = bonneReponseData['texte-de-la-reponse'] || bonneReponseData.name;

            // Générer le hash
            const hash = generateHash(`${questionId}-${bonneReponseRef}-${reponseText}`);

            answersHash[questionId] = {
                hash: hash,
                questionName: questionName
            };

            processedCount++;
            console.log(`✓ Question: "${questionName}"`);
            console.log(`  Hash généré: ${hash}\n`);
        }

        // 5. SAUVEGARDER LE FICHIER JSON
        console.log('💾 Sauvegarde du fichier JSON...');

        const output = {
            generated: new Date().toISOString(),
            totalQuestions: processedCount,
            answers: answersHash
        };

        fs.writeFileSync(
            CONFIG.outputFile,
            JSON.stringify(output, null, 2),
            'utf8'
        );

        console.log(`✅ Fichier "${CONFIG.outputFile}" créé avec succès!\n`);
        console.log('📊 STATISTIQUES:');
        console.log(`   - Questions traitées: ${processedCount}/${questions.length}`);
        console.log(`   - Réponses totales: ${reponses.length}`);
        console.log(`\n🎉 Synchronisation terminée avec succès!`);

    } catch (error) {
        console.error('❌ ERREUR:', error.message);
        process.exit(1);
    }
}

// ============================================
// EXECUTION
// ============================================

// Vérifier que les variables d'environnement sont définies
if (!CONFIG.apiToken) {
    console.error('❌ ERREUR: WEBFLOW_API_TOKEN non défini dans .env');
    process.exit(1);
}

// Lancer la synchronisation
syncQuizAnswers();