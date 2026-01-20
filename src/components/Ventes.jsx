// src/components/Ventes.jsx
import React, { useState, useEffect } from 'react';
import db from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import '../styles/Common.css'

const Ventes = ({label}) => {
  const [venteItems, setVenteItems] = useState([{
    id: uuidv4(),
    produitId: '',
    quantite: 1,
    prixUnitaire: 0,
    prixAchatUnitaire: 0,
    total: 0,
		commissionVendeur:0,
    commentaire: ''
  }]);
  
  const [produits, setProduits] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    facture: '',
    modePaiement: 'liquide',
    commissionCarte: 2,
    commentaire1: '',
    commentaire2: ''
  });

  useEffect(() => {
    loadProduits();
	loadVentes();
  }, []);

  const loadProduits = async () => {
    const produitsList = await db.produits.toArray();
    setProduits(produitsList);
  };

  const loadVentes = async () => { // on charge surtout pour mettre a jour le dernier numero de facture
    const VentesList = await db.ventes.toArray();
    setVentes(VentesList);
		const maxFacture = 1+Math.max(...VentesList.map(a => Number(a.facture)),99);
		setFormData({...formData, facture: String(maxFacture)});
		console.log('nouvelle vente '+maxFacture);
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = venteItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Si produit sélectionné, charger ses infos
        if (field === 'produitId' && value) {
          const produit = produits.find(p => p.id === parseInt(value));
          if (produit) {
            updatedItem.prixUnitaire = produit.prixVente;
            updatedItem.prixAchatUnitaire = produit.prixAchat;
            updatedItem.total = updatedItem.quantite * produit.prixVente;
						updatedItem.stockAvAchat = String(produit.stock);
						updatedItem.commissionVendeur = produit.commission;
          }
        }
        
        // Calcul automatique du total
        if (field === 'quantite' || field === 'prixUnitaire') {
          updatedItem.total = updatedItem.quantite * updatedItem.prixUnitaire;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setVenteItems(updatedItems);
  };
	
	async function handleFacture (e) {
		setFormData({...formData, facture: e.target.value})
		// on verifie si la facture existe deja
		let achat
		try {
			achat = await db.achats
				.where('facture').equals(e.target.value)
				.first();
			
		} catch (error) {
			console.error('Erreur:', error);
		}
		if (achat){alert('la facture existe deja')}
		else {console.log(e.target.value);}
		//console.log(achat);
	}

  const addNewItem = () => {
    setVenteItems([...venteItems, {
      id: uuidv4(),
      produitId: '',
      quantite: 1,
      prixUnitaire: 0,
      prixAchatUnitaire: 0,
      total: 0,
      commentaire: ''
    }]);
  };

  const calculateTotalVente = () => {
    const total = venteItems.reduce((sum, item) => sum + (item.total || 0), 0);
    
    // Ajouter commission carte si applicable
    if (formData.modePaiement === 'carte') {
      return total * (1 + formData.commissionCarte / 100);
    }
    
    return total;
  };

  const calculateMargeTotale = () => {
    return venteItems.reduce((sum, item) => {
      const marge = (item.prixUnitaire - item.prixAchatUnitaire) * item.quantite;
      return sum + (marge || 0);
    }, 0);
  };
	// fonction qui evite que la touche entree envoie le formulaire !!!
	const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.type !== 'textarea') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const totalVente = calculateTotalVente();
      const margeTotale = calculateMargeTotale();
      
      // Créer la vente principale
      const venteId = await db.ventes.add({
        ...formData,
        total: totalVente,
        marge: margeTotale,
        dateCreation: new Date()
      });
      
      // Ajouter les items et mettre à jour le stock
      for (const item of venteItems) {
        if (item.produitId) {
          // Mettre à jour le stock
          const produit = await db.produits.get(parseInt(item.produitId));
          if (produit) {
            const nouveauStock = produit.stock - item.quantite;
            if (nouveauStock < 0) {
              alert(`Stock insuffisant pour ${produit.type} - ${produit.denomination}`);
              return;
            }
            
            await db.produits.update(parseInt(item.produitId), {
              stock: nouveauStock
            });
          }
          
          // Ajouter l'item de vente
          await db.venteItems.add({
            venteId,
            produitId: item.produitId,
            quantite: item.quantite,
            prixUnitaire: item.prixUnitaire,
            prixAchatUnitaire: item.prixAchatUnitaire,
            total: item.total,
            commentaire: item.commentaire
          });
        }
      }
      
      alert('Vente enregistrée avec succès!');
      const ven = await db.ventes
			.where("total")
			.between(0,1000)
			.toArray();
			
			console.log(ven);
      // Réinitialiser le formulaire
      setVenteItems([{
        id: uuidv4(),
        produitId: '',
        quantite: 1,
        prixUnitaire: 0,
        prixAchatUnitaire: 0,
        total: 0,
        commentaire: ''
      }]);
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        client: '',
        modePaiement: 'liquide',
        commissionCarte: 2,
        commentaire1: '',
        commentaire2: ''
      });
      
      loadProduits(); // Recharger la liste des produits
      
    } catch (error) {
      console.error('Erreur enregistrement vente:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
		<div className="common-container">
			<h1 className="common-title">Nouvelle Vente</h1>
			
			<form onSubmit={handleSubmit} className="common-form">
				{/* Informations générales */}
				<div className="form-section">
					<h2 className="section-title">{label.info}</h2>
					<div className="form-grid">
						<div className="form-group">
							<label className="form-label">{label.date}</label>
							<input
								type="date"
								className="form-input"
								onKeyDown={(e) => handleKeyDown(e)}
								value={formData.date}
								onChange={(e) => setFormData({...formData, date: e.target.value})}
								required
							/>
						</div>
						<div className="form-group">
							<label className="form-group">{label.heure}</label>
							<input
								type="time"
								className="form-input"
								onKeyDown={(e) => handleKeyDown(e)}
								value={formData.heure}
								onChange={(e) => setFormData({...formData, heure: e.target.value})}
								required
							/>
						</div>
						
						<div className="form-group">
							<label className="form-label">{label.facture}</label>
							<input
								type="number"
								className="form-input"
								value={formData.facture}
								onKeyDown={(e) => handleKeyDown(e)}
								onChange={(e) => handleFacture(e)}
								min="1"
                step="1"
                required
							/>
						</div>
						
						<div className="form-group">
							<label className="form-label">Mode de paiement</label>
							<select
								className="form-select"
								value={formData.modePaiement}
								onChange={(e) => setFormData({...formData, modePaiement: e.target.value})}
							>
								<option value="liquide">Liquide</option>
								<option value="carte">Carte bancaire</option>
								<option value="virement">Virement</option>
							</select>
						</div>
						
						{formData.modePaiement === 'carte' && (
							<div className="form-group">
								<label className="form-label">{label.commission}(%)</label>
								<input
									type="number"
									className="w-full p-2 border rounded"
									value={formData.commissionCarte}
									onKeyDown={(e) => handleKeyDown(e)}
									onChange={(e) => setFormData({...formData, commissionCarte: parseFloat(e.target.value)})}
									min="0"
									max="100"
									step="0.1"
								/>
							</div>
						)}
					</div>	
				</div>
				
				{/* Totaux */}
				<div className="form-section">
					<h2 className="section-title">{label.total}</h2>
					<div className="form-grid">
						<div className="form-group">
							<div className="form-label">Marge totale</div>
							<div className="total-label">
								{calculateMargeTotale().toFixed(0)} ₽
							</div>
						</div>
						<div className="form-group">
							<div className="form-label">Total vente</div>
							<div className="total-label">
								{calculateTotalVente().toFixed(0)} ₽
							</div>
						</div>
					
						<div className="form-group">
							<div className="form-label">Commission carte</div>
							<div className="total-label">
								{formData.modePaiement === 'carte' 
									? (calculateTotalVente() * formData.commissionCarte / 100).toFixed(0)
									: '0.00'} ₽
							</div>
						</div>
					</div>
				</div>

				{/* Items de vente */}
				<div className="form-section">
					<div className="section-header">
						<h2 className="section-title">{label.produits}</h2>
						<button
							type="button"
							onClick={addNewItem}
							className="btn btn-add"
						>
							<span className="btn-icon">+</span>
							{label.ajouter} {label.produit}
						</button>
					</div>
					
          {venteItems.map((item, index) => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <h3 className="item-title">{label.produit} {index + 1}</h3>
                {venteItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="btn-remove"
                  >
                    {label.supprimer}
                  </button>
                )}
              </div>
              
              <div className="item-grid">
                <div className="form-group">
                  <label className="form-label">{label.produit}</label>
                  <select
                    className="form-select"
                    value={item.produitId}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'new') {
                        handleItemChange(item.id, 'isNewProduct', true);
                        //handleItemChange(item.id, 'produitId', '');
                      } else {
                        handleItemChange(item.id, 'produitId', value);
                      }
                    }}
                    required
                  >
                    <option value="">{label.selection}</option>
                    {produits.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.type} - {p.denomination}
                      </option>
                    ))}
                  </select>
                </div>
                               
                <div className="form-group">
                  <label className="form-label">{label.quantite}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={item.quantite}
                    onChange={(e) => handleItemChange(item.id, 'quantite', parseFloat(e.target.value))}
                    onKeyDown={(e) => handleKeyDown(e)}
										min="1"
                    step="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{label.pu}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={item.prixUnitaire}
                    onChange={(e) => handleItemChange(item.id, 'prixUnitaire', parseFloat(e.target.value))}
                    onKeyDown={(e) => handleKeyDown(e)}
										min="0"
                    step="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">prix Achat</label>
									<div>
										{item.prixAchatUnitaire.toFixed(0)} ₽
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{label.commission} (%)</label>
									<div>
										{item.commissionVendeur} %
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">marge</label>
									<div>
										{(item.prixUnitaire - item.prixAchatUnitaire) * item.quantite} ₽
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">stock restant</label>
									<div>
										{item.stockAvAchat-item.quantite}
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{label.total}</label>
                  <div className="form-display">
                    {item.total.toFixed(0)} ₽
                  </div>
                </div>
                
              </div>
            </div>
          ))}
					
				</div>

				{/* Commentaires */}
				<div className="form-section">
					<div className="form-group">
						<label className="form-label">{label.commentaire} 1</label>
						<textarea
							className="form-textarea"
							rows="3"
							value={formData.commentaire1}
							onChange={(e) => setFormData({...formData, commentaire1: e.target.value})}
						/>
					</div>
					
					<div>
						<label className="form-label">{label.commentaire} 2</label>
						<textarea
							className="form-textarea"
							rows="3"
							value={formData.commentaire2}
							onChange={(e) => setFormData({...formData, commentaire2: e.target.value})}
						/>
					</div>
				</div>


				<div className="form-actions">
					<button
						type="submit"
						className="btn btn-primary"
					>
						{label.enregistrer}
					</button>
				</div>
			</form>
		</div>
  );
};

export default Ventes;