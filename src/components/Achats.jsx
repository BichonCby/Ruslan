// src/components/Achats.jsx
// TODO liste
// check la facture et editer
// si la facture existe, la charger
// export excel et pdf
// rajouter si la facture est payee
// sauvegarder la BD et la charger
// avant d'ajouter un produit, verifier qu'il n'existe pas 


import React, { useState, useEffect } from 'react';
import db from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import '../styles/Common.css'

const Achats = ({label}) => {
  const [achatItems, setAchatItems] = useState([{
    id: uuidv4(),
    produitId: '',
    type: '',
    denomination: '',
    quantite: 1,
    prixUnitaire: 0,
    commissionVendeur: 5,
    total: 0,
//    commentaire: '',
    isNewProduct: false
  }]);
  
  const [produits, setProduits] = useState([]);
  const [vendeurs, setVendeurs] = useState([]);
  const [achats, setAchats] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
		isNewVendeur:false,
    vendeur: '',
    vendeurId: 0,
		facture: '',
    estPaye: false,
    datePaiement: '',
    commentaire1: '',
    commentaire2: ''
  });

  useEffect(() => {
    loadProduits();
    loadVendeurs();
		loadAchats();
  }, []);

  const loadProduits = async () => {
    const produitsList = await db.produits.toArray();
    setProduits(produitsList);
  };

  const loadVendeurs = async () => {
    const vendeursList = await db.vendeurs.toArray();
    setVendeurs(vendeursList);
  };
	
  const loadAchats = async () => { // on charge surtout pour mettre a jour le dernier numero de facture
    const AchatsList = await db.achats.toArray();
    setAchats(AchatsList);
		let maxFacture=1;
		if (AchatsList.length>0){
			maxFacture = 1+Math.max(...AchatsList.map(a => Number(a.facture)))
		};
		setFormData({...formData, facture: String(maxFacture)});
		//console.log('max '+maxFacture);
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = achatItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Calcul automatique du total
        if (field === 'quantite' || field === 'prixUnitaire') {
          updatedItem.total = updatedItem.quantite * updatedItem.prixUnitaire;
        }
        
        // Si produit sélectionné, charger ses infos
        if (field === 'produitId' && value) {
          const produit = produits.find(p => p.id === parseInt(value));
          if (produit) {
            updatedItem.type = produit.type;
            updatedItem.denomination = produit.denomination;
            updatedItem.prixUnitaire = produit.prixAchat;
            updatedItem.total = updatedItem.quantite * produit.prixAchat;
						updatedItem.commissionVendeur = produit.commissionVendeur;
            updatedItem.isNewProduct = false;
          }
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setAchatItems(updatedItems);
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
    setAchatItems([...achatItems, {
      id: uuidv4(),
      produitId: '',
      type: '',
      denomination: '',
      quantite: 1,
      prixUnitaire: 0,
      commissionVendeur: 5,
      total: 0,
//     commentaire: '',
      isNewProduct: false
    }]);
  };

  const removeItem = (id) => {
    if (achatItems.length > 1) {
      setAchatItems(achatItems.filter(item => item.id !== id));
    }
  };
	
  async function createProduct(item){
    //if (achatItems.length > 1) {
    //  setAchatItems(achatItems.filter(item => item.id !== id));
    //}
		let count
		try {
			count = await db.produits
				.where('type').equals(item.type)
				.and(produit => produit.denomination === item.denomination)
				.count();
			
		} catch (error) {
			console.error('Erreur:', error);
		}
		if (count>0){
			alert('produit existant');
		}
		else {
			await db.produits.add({
				type: item.type,
				denomination: item.denomination,
				stock: 0,
				prixAchat: item.prixUnitaire,
				prixVente: 0,
				commissionVendeur: 0
			});
		}
		loadProduits();
		item.isNewProduct=false;

  };

async function createVendeur(formData){
		let count
		try {
			count = await db.vendeurs
				.where('nom').equals(formData.vendeur)
				.count();
			
		} catch (error) {
			console.error('Erreur:', error);
		}
		if (count>0){
			alert('Vendeur existant');
		}
		else {
			await db.vendeurs.add({
				nom: formData.vendeur,
//				commissionParDefaut: 0
			});
		}
		loadVendeurs();
		formData.isNewVendeur=false;
  };

  const calculateTotalAchat = () => {
    return achatItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };
	
	// fonction qui evite que la touche entree envoie le formulaire !!!
	const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.type !== 'textarea') {
      e.preventDefault();
    }
  };
  const handleSubmit = async (e) => {
   // e.preventDefault();
    
    try {
      const totalAchat = calculateTotalAchat();
      
      // Créer l'achat principal
      const achatId = await db.achats.add({
        //...formData,
				date:formData.date,
				heure:formData.heure,
				facture:formData.facture,
				vendeurID:formData.vendeurId,
				estPaye:formData.estPaye,
				datePaiement:formData.datePaiement,
				commentaire1:formData.commentaire1,
				commentaire2:formData.commentaire2,
        total: totalAchat,
 //       dateCreation: new Date()
      });
      
      // Ajouter les items
      for (const item of achatItems) {
        let produitId = item.produitId;
        
        // Si nouveau produit, l'ajouter à la base
        if (item.isNewProduct || !item.produitId) {
          const newProduitId = await db.produits.add({
            type: item.type,
            denomination: item.denomination,
            stock: item.quantite,
            prixAchat: item.prixUnitaire,
            prixVente: item.prixUnitaire * 1.5, // Prix par défaut
						quantite:item.quantite,
						commissionVendeur: item.commission,
            dateCreation: new Date()
          });
          produitId = newProduitId;
        } else {
          // Mettre à jour le stock
          const produit = await db.produits.get(parseInt(item.produitId));
          if (produit) {
            await db.produits.update(parseInt(item.produitId), {
              stock: produit.stock + item.quantite
            });
          }
        }
        
        // Ajouter l'item d'achat
        await db.achatItems.add({
          achatId,
          produitId,
          //type: item.type,
          //denomination: item.denomination,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          //total: item.total,
          commissionVendeur: item.commissionVendeur,
          //commentaire: item.commentaire
        });
      }
      
      alert('Achat enregistré avec succès!');
      
      // Réinitialiser le formulaire
      setAchatItems([{
        id: uuidv4(),
        produitId: '',
        type: '',
        denomination: '',
        quantite: 1,
        prixUnitaire: 0,
        commissionVendeur: 0,
        total: 0,
        //commentaire: '',
        isNewProduct: false
      }]);
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        vendeur: '',
        estPaye: false,
        datePaiement: '',
        commentaire1: '',
        commentaire2: ''
      });
      
      loadProduits(); // Recharger la liste des produits
      
    } catch (error) {
      console.error('Erreur enregistrement achat:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="common-container">
      <h1 className="common-title">{label.titleAchat}</h1>
      
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
							<label className="form-label">{label.heure}</label>
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
							<label className="form-label">{label.vendeur}</label>
							<select
								className="form-select"
								value={formData.vendeur}
								onChange={(e) => {
									if (e.target.value === 'new'){
										setFormData({...formData, isNewVendeur: true});
									} else {
										const selectedVendeur = vendeurs.find(v => v.nom === e.target.value);
										console.log('target '+selectedVendeur.id);
										setFormData({...formData, vendeur: selectedVendeur.nom,vendeurId:selectedVendeur.id,isNewVendeur: false});
									}
									console.log('new vendeur '+formData.isNewVendeur);
								}}
								required
							>
								<option value="">{label.selection}</option>
								<option value="new">+ {label.nouveauproduit}</option>
								{vendeurs.map(v => (
									<option key={v.id} value={v.nom}>{v.nom}</option>
								))}
							</select>
						</div>
						{formData.isNewVendeur ? (
							<div>
								<div className="form-group">
									<label className="form-label">Nom vendeur</label>
									<input
										type="text"
										className="form-input"
										value={formData.vendeur}
										onChange={(e) => {
											const selectedVendeur = vendeurs.find(v => v.nom === e.target.value);
											setFormData({...formData, vendeur: e.target.value,vendeurId: selectedVendeur.id})
										}}
										onKeyDown={(e) => handleKeyDown(e)}
										placeholder="Ex: Paul"
										required
									/>
								</div>
								<button
									type="button"
									onClick={() => createVendeur(formData)}
									className="btn-remove"
								>+
								</button>
							</div>
						) : null}						
					</div>
        </div>
        <div className="form-section">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="estPaye"
              className="checkbox"
              checked={formData.estPaye}
              onChange={(e) => setFormData({
                ...formData, 
                estPaye: e.target.checked,
                datePaiement: e.target.checked ? new Date().toISOString().split('T')[0] : ''
              })}
            />
            <label htmlFor="estPaye" className="checkbox-label">{label.paid}</label>
          </div>
          
          {formData.estPaye && (
            <div className="form-group">
              <label className="form-label">{label.date}</label>
              <input
                type="date"
                className="form-input"
                value={formData.datePaiement}
								onKeyDown={(e) => handleKeyDown(e)}
                onChange={(e) => setFormData({...formData, datePaiement: e.target.value})}
              />
            </div>
          )}
          
          <div className="total-container">
            <div className="total-label">
              {label.total}: {calculateTotalAchat().toFixed(0)} ₽
            </div>
          </div>
        </div>

        {/* Items d'achat */}
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
          
          {achatItems.map((item, index) => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <h3 className="item-title">{label.produit} {index + 1}</h3>
                {achatItems.length > 1 && (
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
                    <option value="new">+ {label.nouveauproduit}</option>
                    {produits.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.type} - {p.denomination}
                      </option>
                    ))}
                  </select>
                </div>
                
                {item.isNewProduct ? (
                  <div>
                    <div className="form-group">
                      <label className="form-label">{label.type}</label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.type}
                        onChange={(e) => handleItemChange(item.id, 'type', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e)}
												placeholder="Ex: Café"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">{label.denomination}</label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.denomination}
                        onChange={(e) => handleItemChange(item.id, 'denomination', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e)}
												placeholder="Ex: Vert 100g"
                        required
                      />
                    </div>
										<button
											type="button"
											onClick={() => createProduct(item)}
											className="btn-remove"
										>+
										</button>
                  </div>
                ) : null}
                
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
                  <label className="form-label">{label.commission} (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={item.commissionVendeur}
                    onChange={(e) => handleItemChange(item.id, 'commissionVendeur', parseFloat(e.target.value))}
                    onKeyDown={(e) => handleKeyDown(e)}
										min="0"
                    max="100"
                    step="0.1"
                  />
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

        {/* Commentaires et paiement */}
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

export default Achats;