// src/utils/database.js
import Dexie from 'dexie';

const db = new Dexie('MagasinDB');

// Définition des schémas
db.version(1).stores({
  produits: '++id, type, denomination, stock, prixAchat, prixVente, commission',
  achats: '++id, date, heure, facture, vendeurId, vendeur, estPaye, datePaiement, total, commentaire1, commentaire2',
  achatItems: '++id, achatId, produitId, type, denomination, quantite, prixUnitaire, total',
  ventes: '++id, date, heure, facture, modePaiement, commissionCarte, total, commentaire1, commentaire2',
  venteItems: '++id, venteId, produitId, type, denomination, quantite, prixUnitaire, prixAchatUnitaire, total, commentaire',
  vendeurs: '++id, nom'
});

// Initialisation avec données de test
export const initDatabase = async () => {
  try {
    await db.open();
    
    // Vérifier si la base est vide
    const count = await db.produits.count();
    
    if (count === 0) {
      // Ajouter des exemples de produits
      await db.produits.bulkAdd([
        {
          type: 'Café',
          denomination: 'Vert 100g',
					commission: 20,
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
					commission: 20,
        },
        {
          type: 'Thé',
          denomination: 'Vert 100g',
          stock: 25,
          prixAchat: 6,
          prixVente: 10,
					commission: 20,
        }
      ]);
      
      await db.vendeurs.bulkAdd([
        { nom: 'Jean'},
        { nom: 'Marie'}
      ]);
    }
    
    return db;
  } catch (error) {
    console.error('Erreur initialisation DB:', error);
    throw error;
  }
};

export default db;