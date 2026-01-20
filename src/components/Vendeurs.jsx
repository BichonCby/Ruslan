// src/components/Vendeurs.jsx
import React, { useState, useEffect } from 'react';
import db from '../utils/database';

const Vendeurs = () => {
  const [produits, setProduits] = useState([]);
  const [vendeurs, setVendeurs] = useState([]);//new
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadVendeurs();
  }, []);

  const loadVendeurs = async () => {
    const vendeursList = await db.vendeurs.toArray();
    setVendeurs(vendeursList);
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

  const filteredVendeurs = vendeurs.filter(vendeur =>
    vendeur.nom.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="common-bg">
      <h1 className="common-title">Vendeurs</h1>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Nombre de vendeurs</div>
          <div className="text-2xl font-bold">{vendeurs.length}</div>
        </div>
				<button
              type="button"
              onClick={addNewSeller}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              + Ajouter un vendeur
        </button>

      </div>

      {/* Filtre */}
      <div className="mb-6">
        <input
          type="text"
          className="w-full p-3 border rounded-lg"
          placeholder="Rechercher par type ou dénomination..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Tableau des produits */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">nombre achats</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVendeurs.map((vendeur) => (
              editingId === vendeur.id ? (
                <tr key={vendeur.id} className="bg-yellow-50">
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editForm.nom}
                      onChange={(e) => setEditForm({...editForm, nom: e.target.value})}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editForm.commissionParDefaut}
                      onChange={(e) => setEditForm({...editForm, commissionParDefaut: e.target.value})}
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
                  <td className="px-6 py-4">{vendeur.nom}</td>
                  <td className="px-6 py-4">{vendeur.commissionParDefaut}</td>
                  <td className="px-6 py-4">nb achats</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(vendeur)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(vendeur.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {filteredVendeurs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun vendeur trouvé
        </div>
      )}
    </div>
  );
};

export default Vendeurs;