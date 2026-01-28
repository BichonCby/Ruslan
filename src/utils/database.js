// src/utils/database.js
import Dexie from 'dexie';

const db = new Dexie('MagasinDB');

// Définition des schémas
db.version(1).stores({
  produits: '++id, type, denomination, stock, prixAchat, prixVente, commissionVendeur',
  achats: '++id, date, heure, facture, vendeurId, estPaye, datePaiement, total, commentaire1, commentaire2',
  achatItems: '++id, achatId, produitId, quantite, prixUnitaire, total',
  ventes: '++id, date, heure, facture, modePaiement, commissionCarte, total, commentaire1, commentaire2',
  venteItems: '++id, venteId, produitId, type, denomination, quantite, prixUnitaire, prixAchatUnitaire, total, commentaire',
  vendeurs: '++id, nom'
});
function monStock(){
	return 50;
}
// Initialisation avec données de test
export const initDatabase = async () => {
  try {
    await db.open();
    
		// Vérifier si les données initiales ont déjà été ajoutées
    const isInitialized = false;//localStorage.getItem('db_initialized');

    if (!isInitialized) {
      console.log('Première initialisation de la base de données...');
    
    // Vérifier si la base est vide
      const produitsCount = await db.produits.count();
      const vendeursCount = await db.vendeurs.count();

    if (produitsCount === 0) {
      // Ajouter des exemples de produits
        await db.produits.bulkAdd([
          {
            type: 'Café',
            denomination: 'Grain 100g',
            commissionVendeur: 20,
            stock: 50,
            prixAchat: 8,
            prixVente: 12,
          },
          {
            type: 'Café',
            denomination: 'Noir 250g',
            stock: 30,
            prixAchat: 15,
            prixVente: 20,
            commissionVendeur: 20,
          },
          {
            type: 'Thé',
            denomination: 'Vert 100g',
            stock: 25,
            prixAchat: 6,
            prixVente: 10,
            commissionVendeur: 20,
          }
        ]);
      }
      
      if (vendeursCount === 0) {
        console.log('Ajout des vendeurs initiaux...');
        await db.vendeurs.bulkAdd([
          { nom: 'Jean' },
          { nom: 'Marie' }
        ]);
      }
      // Marquer comme initialisé dans localStorage
      localStorage.setItem('db_initialized', 'true');
      console.log('Base de données initialisée avec succès');
    } else {
      console.log('Base de données déjà initialisée (flag localStorage)');
    }
    

    
    return db;
  } catch (error) {
    console.error('Erreur initialisation DB:', error);
    throw error;
  }
};

export default db;