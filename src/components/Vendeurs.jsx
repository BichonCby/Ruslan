// src/components/Vendeurs.jsx
import React, { useState, useEffect } from 'react';
import db from '../utils/database';
import '../styles/Vendeurs.css';

const Vendeurs = ({label}) => {
  const [produits, setProduits] = useState([]);
  const [vendeurs, setVendeurs] = useState([]);//new
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'nom', direction: 'asc' });
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadVendeurs();
  }, []);

  const loadVendeurs = async () => {
    const vendeursList = await db.vendeurs.toArray();
		const achatsList = await db.achats.toArray();
    // Créer une structure avec le nombre d'achats pour chaque vendeur
    const vendeursAvecAchats = vendeursList.map(vendeur => {
      // Compter les achats pour ce vendeur
      const nombreAchats = achatsList.filter(achat => 
        achat.vendeur === vendeur.nom
      ).length;
      
      // Retourner un nouvel objet avec les infos du vendeur + nombre d'achats
      return {
        ...vendeur,  // conserve toutes les propriétés du vendeur
        nombreAchats: nombreAchats
      };
    });
    console.log(vendeursAvecAchats);
    setVendeurs(vendeursAvecAchats);
  };

  const handleEdit = (vendeur) => {
    setEditingId(vendeur.id);
    setEditForm({ ...vendeur });
  };

  const  addNewSeller = async() => {
		await db.vendeurs.add({
            nom: 'toto',
            commissionParDefaut: 5,
          });
		loadVendeurs();
  };
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

	const sortedVendeurs = [...vendeurs].sort((a, b) => {
    if (sortConfig.key === 'nom') {
			//console.log('par nom');
      return sortConfig.direction === 'asc' ? a.nom - b.nom : b.nom - a.nom;
    }
    if (sortConfig.key === 'nombreAchats') {
      //console.log('par achat');
			return sortConfig.direction === 'asc' ? a.nombreAchats - b.nombreAchats : b.nombreAchats - a.nombreAchats;
    }
    return 0;
  });

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="sort-icon">↕</span>;
    return sortConfig.direction === 'asc' 
      ? <span className="sort-icon">↑</span> 
      : <span className="sort-icon">↓</span>;
  };

  const handleSave = async () => {
    try {
      await db.vendeurs.update(editingId, editForm);
      setEditingId(null);
      loadVendeurs();
      alert('Produit mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce vendeur ?')) {
      try {
        await db.vendeurs.delete(id);
        loadVendeurs();
        alert('Produit supprimé');
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const filteredVendeurs = sortedVendeurs.filter(vendeur => {
		//console.log('on va filtrer'+sortConfig.direction);
    return vendeur.nom.toLowerCase().includes(filter.toLowerCase())
  });

  return (
    <div className="vendeurs-container">
      <h1 className="vendeurs-title">Vendeurs</h1>
      
      {/* Statistiques */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-label">Nombre de vendeurs</div>
          <div className="stat-value">{vendeurs.length}</div>
        </div>

      </div>
			<button
						type="button"
						onClick={addNewSeller}
						className="btn btn-refresh"
					>
						+ Ajouter un vendeur
			</button>

      {/* Filtre */}
      <div className="controls-container">
				<div className="search-container">
					<input
						type="text"
						className="search-input"
						placeholder={label.recherche}
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
					/>
				</div>
      </div>

      {/* Tableau des produits */}
      <div className="table-container">
        <table className="vendeurs-table">
          <thead>
            <tr>
              <th 
								className="table-header sortable"
								onClick={() => handleSort('nom')}
								>
								{label.nom}<SortIcon columnKey="nom" />
							</th>
              <th 
								className="table-header sortable"
								onClick={() => handleSort('nombreAchats')}
								>
								{label.nombreAchats}<SortIcon columnKey="nombreAchats" />
							</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendeurs.map((vendeur) => (
              editingId === vendeur.id ? (
                <tr key={vendeur.id} className="editing-row">
                  <td>
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.nom}
                      onChange={(e) => setEditForm({...editForm, nom: e.target.value})}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.nombreAchats}
                      onChange={(e) => setEditForm({...editForm, nombreAchats: e.target.value})}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={handleSave}
                      className="text-green-600 hover:text-green-800 mr-3"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Annuler
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={vendeur.id}>
                  <td className="valeur-display">{vendeur.nom}</td>
                  <td className="valeur-display">{vendeur.nombreAchats}</td>
                  <td className="valeur-display">
                    <button
                      onClick={() => handleEdit(vendeur)}
                      className="btn-action btn-edit"
											title={label.modifier}
                    >
                      <span className="action-icon">✏️</span>
                      {label.modifier}
                    </button>
                    <button
                      onClick={() => handleDelete(vendeur.id)}
                      className="btn-action btn-delete"
											title={label.supprimer}
                    >
                      <span className="action-icon">🗑️</span>
                      {label.supprimer}
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {filteredVendeurs.length === 0 && (
        <div className="empty-title">
          Aucun vendeur trouvé
        </div>
      )}
    </div>
  );
};

export default Vendeurs;