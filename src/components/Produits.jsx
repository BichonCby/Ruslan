// src/components/Produits.jsx
import React, { useState, useEffect } from 'react';
import db from '../utils/database';

const Produits = () => {
  const [produits, setProduits] = useState([]);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = async () => {
    const produitsList = await db.produits.toArray();
    setProduits(produitsList);
  };

  const handleEdit = (produit) => {
    setEditingId(produit.id);
    setEditForm({ ...produit });
  };

  const handleSave = async () => {
    try {
      await db.produits.update(editingId, editForm);
      setEditingId(null);
      loadProduits();
      alert('Produit mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce produit ?')) {
      try {
        await db.produits.delete(id);
        loadProduits();
        alert('Produit supprimé');
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const filteredProduits = produits.filter(produit =>
    produit.type.toLowerCase().includes(filter.toLowerCase()) ||
    produit.denomination.toLowerCase().includes(filter.toLowerCase())
  );

  const calculateValeurStock = () => {
    return produits.reduce((sum, produit) => 
      sum + (produit.stock * produit.prixAchat), 0
    );
  };

  const calculateValeurVente = () => {
    return produits.reduce((sum, produit) => 
      sum + (produit.stock * produit.prixVente), 0
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion du Stock</h1>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Nombre de produits</div>
          <div className="text-2xl font-bold">{produits.length}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Valeur du stock (achat)</div>
          <div className="text-2xl font-bold">{calculateValeurStock().toFixed(2)} €</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Valeur du stock (vente)</div>
          <div className="text-2xl font-bold">{calculateValeurVente().toFixed(2)} €</div>
        </div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dénomination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix Achat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix Vente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marge</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valeur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProduits.map((produit) => (
              editingId === produit.id ? (
                <tr key={produit.id} className="bg-yellow-50">
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editForm.type}
                      onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editForm.denomination}
                      onChange={(e) => setEditForm({...editForm, denomination: e.target.value})}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={editForm.stock}
                      onChange={(e) => setEditForm({...editForm, stock: parseInt(e.target.value)})}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={editForm.prixAchat}
                      onChange={(e) => setEditForm({...editForm, prixAchat: parseFloat(e.target.value)})}
                      step="0.01"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={editForm.prixVente}
                      onChange={(e) => setEditForm({...editForm, prixVente: parseFloat(e.target.value)})}
                      step="0.01"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="p-2 border rounded bg-gray-50">
                      {(editForm.prixVente - editForm.prixAchat).toFixed(2)} €
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="p-2 border rounded bg-gray-50">
                      {(editForm.stock * editForm.prixAchat).toFixed(2)} €
                    </div>
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
                <tr key={produit.id}>
                  <td className="px-6 py-4">{produit.type}</td>
                  <td className="px-6 py-4">{produit.denomination}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      produit.stock < 10 ? 'bg-red-100 text-red-800' :
                      produit.stock < 20 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {produit.stock} unités
                    </span>
                  </td>
                  <td className="px-6 py-4">{produit.prixAchat.toFixed(2)} €</td>
                  <td className="px-6 py-4">{produit.prixVente.toFixed(2)} €</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      (produit.prixVente - produit.prixAchat) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(produit.prixVente - produit.prixAchat).toFixed(2)} €
                    </span>
                  </td>
                  <td className="px-6 py-4">{(produit.stock * produit.prixAchat).toFixed(2)} €</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(produit)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(produit.id)}
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

      {filteredProduits.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun produit trouvé
        </div>
      )}
    </div>
  );
};

export default Produits;