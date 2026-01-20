// src/components/Stock.jsx
import React, { useState, useEffect } from 'react';
import db from '../utils/database';
import '../styles/Stock.css';

const Stock = ({label}) => {
  const [produits, setProduits] = useState([]);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'type', direction: 'asc' });
  const [showLowStock, setShowLowStock] = useState(false);

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
      alert('Produit mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await db.produits.delete(id);
        loadProduits();
        alert('Produit supprimé avec succès');
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProduits = [...produits].sort((a, b) => {
    if (sortConfig.key === 'stock') {
      return sortConfig.direction === 'asc' ? a.stock - b.stock : b.stock - a.stock;
    }
    
    if (sortConfig.key === 'valeurAchat') {
      const valA = a.stock * a.prixAchat;
      const valB = b.stock * b.prixAchat;
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    }
    
    const aVal = a[sortConfig.key] || '';
    const bVal = b[sortConfig.key] || '';
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredProduits = sortedProduits.filter(produit => {
    const matchesFilter = 
      produit.type.toLowerCase().includes(filter.toLowerCase()) ||
      produit.denomination.toLowerCase().includes(filter.toLowerCase());
    
    const matchesStockFilter = !showLowStock || produit.stock < 10;
    
    return matchesFilter && matchesStockFilter;
  });

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

  const calculateMargeTotale = () => {
    return produits.reduce((sum, produit) => 
      sum + ((produit.prixVente - produit.prixAchat) * produit.stock), 0
    );
  };

  const getStockClass = (stock) => {
    if (stock < 5) return 'stock-critical';
    if (stock < 10) return 'stock-low';
    if (stock < 20) return 'stock-medium';
    return 'stock-good';
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="sort-icon">↕</span>;
    return sortConfig.direction === 'asc' 
      ? <span className="sort-icon">↑</span> 
      : <span className="sort-icon">↓</span>;
  };

  return (
    <div className="stock-container">
      <h1 className="stock-title">{label.titleStock}</h1>
      
      {/* Statistiques */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-label">{label.nombreProduits}</div>
            <div className="stat-value">{produits.length}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">{label.valeurStockAchat}</div>
            <div className="stat-value">{calculateValeurStock().toFixed(0)} ₽</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">{label.valeurStockVente}</div>
            <div className="stat-value">{calculateValeurVente().toFixed(0)} ₽</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💹</div>
          <div className="stat-content">
            <div className="stat-label">{label.margePotentielle}</div>
            <div className="stat-value">{calculateMargeTotale().toFixed(0)} ₽</div>
          </div>
        </div>
      </div>

      {/* Contrôles de filtrage */}
      <div className="controls-container">
        <div className="search-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            className="search-input"
            placeholder={label.recherche}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button 
              onClick={() => setFilter('')}
              className="clear-search"
              title={label.effacer}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="filter-controls">
          <button 
            onClick={loadProduits}
            className="btn btn-refresh"
            title="Actualiser la liste"
          >
            <span className="btn-icon">🔄</span>
            {label.actualiser}
          </button>
        </div>
      </div>

      {/* Tableau des produits */}
      <div className="table-container">
        <table className="stock-table">
          <thead>
            <tr>
              <th 
                className="table-header sortable"
                onClick={() => handleSort('type')}
              >
								{label.type} <SortIcon columnKey="type" />
              </th>
              <th 
                className="table-header sortable"
                onClick={() => handleSort('denomination')}
              >
                {label.denomination} <SortIcon columnKey="denomination" />
              </th>
              <th 
                className="table-header sortable"
                onClick={() => handleSort('stock')}
              >
                {label.stock} <SortIcon columnKey="stock" />
              </th>
              <th 
                className="table-header sortable"
                onClick={() => handleSort('prixAchat')}
              >
                {label.prixAchat} <SortIcon columnKey="prixAchat" />
              </th>
              <th 
                className="table-header sortable"
                onClick={() => handleSort('prixVente')}
              >
                {label.prixVente} <SortIcon columnKey="prixVente" />
              </th>
              <th className="table-header">Marge unitaire</th>
              <th 
                className="table-header sortable"
                onClick={() => handleSort('valeurAchat')}
              >
                {label.valeurStock} <SortIcon columnKey="valeurAchat" />
              </th>
              <th className="table-header">{label.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredProduits.map((produit) => (
              editingId === produit.id ? (
                <tr key={produit.id} className="editing-row">
                  <td>
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.type}
                      onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.denomination}
                      onChange={(e) => setEditForm({...editForm, denomination: e.target.value})}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="edit-input"
                      value={editForm.stock}
                      onChange={(e) => setEditForm({...editForm, stock: parseInt(e.target.value) || 0})}
                      min="0"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="edit-input"
                      value={editForm.prixAchat}
                      onChange={(e) => setEditForm({...editForm, prixAchat: parseFloat(e.target.value) || 0})}
                      step="1"
                      min="0"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="edit-input"
                      value={editForm.prixVente}
                      onChange={(e) => setEditForm({...editForm, prixVente: parseFloat(e.target.value) || 0})}
                      step="1"
                      min="0"
                    />
                  </td>
                  <td className="marge-cell">
                    <div className="marge-display">
                      {(editForm.prixVente - editForm.prixAchat).toFixed(0)} ₽
                    </div>
                  </td>
                  <td className="valeur-cell">
                    <div className="valeur-display">
                      {(editForm.stock * editForm.prixAchat).toFixed(0)} ₽
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={handleSave}
                      className="btn-action btn-save"
                      title={label.enregistrer}
                    >
                      <span className="action-icon">💾</span>
                      {label.enregistrer}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-action btn-cancel"
                      title={label.annuler}
                    >
                      <span className="action-icon">✕</span>
                      {label.annuler}
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={produit.id} className="product-row">
                  <td className="type-cell">{produit.type}</td>
                  <td className="denomination-cell">{produit.denomination}</td>
                  <td className="stock-cell">
                    <span className={`stock-badge ${getStockClass(produit.stock)}`}>
                      {produit.stock} {label.unites}
                    </span>
                  </td>
                  <td className="price-cell">{produit.prixAchat.toFixed(0)} ₽</td>
                  <td className="price-cell">{produit.prixVente.toFixed(0)} ₽</td>
                  <td className="marge-cell">
                    <span className={`marge-value ${(produit.prixVente - produit.prixAchat) >= 0 ? 'positive' : 'negative'}`}>
                      {(produit.prixVente - produit.prixAchat).toFixed(0)} ₽
                    </span>
                  </td>
                  <td className="valeur-cell">
                    <div className="valeur-display">
                      {(produit.stock * produit.prixAchat).toFixed(0)} ₽
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="actions-buttons">
                      <button
                        onClick={() => handleEdit(produit)}
                        className="btn-action btn-edit"
                        title={label.modifier}
                      >
                        <span className="action-icon">✏️</span>
                        {label.modifier}
                      </button>
                      <button
                        onClick={() => handleDelete(produit.id)}
                        className="btn-action btn-delete"
                        title={label.supprimer}
                      >
                        <span className="action-icon">🗑️</span>
                        {label.supprimer}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>

        {filteredProduits.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3 className="empty-title">{label.aucunProduit}</h3>
            <p className="empty-message">
              {filter || showLowStock 
                ? 'Aucun produit ne correspond à vos critères de recherche.'
                : 'Aucun produit n\'a été ajouté au stock.'}
            </p>
            {filter && (
              <button 
                onClick={() => setFilter('')}
                className="btn btn-clear-filters"
              >
                {label.effacerFiltres}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Résumé */}
      <div className="summary-container">
        <div className="summary-content">
          <div className="summary-item">
            <span className="summary-label">Produits affichés :</span>
            <span className="summary-value">{filteredProduits.length} / {produits.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Stock faible (&lt; 10) :</span>
            <span className="summary-value">
              {produits.filter(p => p.stock < 10).length} produits
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Stock critique (&lt; 5) :</span>
            <span className="summary-value critical">
              {produits.filter(p => p.stock < 5).length} produits
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stock;