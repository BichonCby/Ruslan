// src/components/Export.jsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import db from '../utils/database';

const Export = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportType, setExportType] = useState('achats');
  const [data, setData] = useState([]);

  useEffect(() => {
    // Définir date de début comme premier jour du mois
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      if (exportType === 'achats') {
        const achats = await db.achats
          .where('date')
          .between(startDate, endDate)
          .toArray();
        
        const achatsWithItems = await Promise.all(
          achats.map(async achat => {
            const items = await db.achatItems
              .where('achatId')
              .equals(achat.id)
              .toArray();
            return { ...achat, items };
          })
        );
        
        setData(achatsWithItems);
      } else if (exportType === 'ventes') {
        const ventes = await db.ventes
          .where('date')
          .between(startDate, endDate)
          .toArray();
        
        const ventesWithItems = await Promise.all(
          ventes.map(async vente => {
            const items = await db.venteItems
              .where('venteId')
              .equals(vente.id)
              .toArray();
            return { ...vente, items };
          })
        );
        
        setData(ventesWithItems);
      } else if (exportType === 'stock') {
        const produits = await db.produits.toArray();
        setData(produits);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadData();
    }
  }, [startDate, endDate, exportType]);

  const exportToExcel = () => {
    let worksheetData = [];
    let fileName = '';

    if (exportType === 'achats') {
      fileName = `achats_${startDate}_${endDate}.xlsx`;
      worksheetData = data.flatMap(achat => 
        achat.items.map(item => ({
          Date: achat.date,
          Heure: achat.heure,
          Vendeur: achat.vendeur,
          Type: item.type,
          Dénomination: item.denomination,
          Quantité: item.quantite,
          'Prix Unitaire': item.prixUnitaire,
          Total: item.total,
          'Commission Vendeur': `${item.commissionVendeur}%`,
          Payé: achat.estPaye ? 'Oui' : 'Non',
          'Date Paiement': achat.datePaiement || '',
          Commentaire: item.commentaire,
          'Commentaire 1': achat.commentaire1,
          'Commentaire 2': achat.commentaire2
        }))
      );
    } else if (exportType === 'ventes') {
      fileName = `ventes_${startDate}_${endDate}.xlsx`;
      worksheetData = data.flatMap(vente => 
        vente.items.map(item => ({
          Date: vente.date,
          Heure: vente.heure,
          Client: vente.client,
          'Mode Paiement': vente.modePaiement,
          'Commission Carte': `${vente.commissionCarte}%`,
          Type: item.type,
          Dénomination: item.denomination,
          Quantité: item.quantite,
          'Prix Unitaire': item.prixUnitaire,
          'Prix Achat': item.prixAchatUnitaire,
          Marge: (item.prixUnitaire - item.prixAchatUnitaire) * item.quantite,
          Total: item.total,
          'Total avec Commission': vente.total,
          Commentaire: item.commentaire,
          'Commentaire 1': vente.commentaire1,
          'Commentaire 2': vente.commentaire2
        }))
      );
    } else if (exportType === 'stock') {
      fileName = `stock_${new Date().toISOString().split('T')[0]}.xlsx`;
      worksheetData = data.map(produit => ({
        Type: produit.type,
        Dénomination: produit.denomination,
        Stock: produit.stock,
        'Prix Achat': produit.prixAchat,
        'Prix Vente': produit.prixVente,
        Marge: (produit.prixVente - produit.prixAchat).toFixed(2),
        'Valeur Achat': (produit.stock * produit.prixAchat).toFixed(2),
        'Valeur Vente': (produit.stock * produit.prixVente).toFixed(2),
        'Date Création': new Date(produit.dateCreation).toLocaleDateString('fr-FR')
      }));
    }

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Données');
    XLSX.writeFile(wb, fileName);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Titre
    doc.setFontSize(16);
    doc.text(`Rapport ${exportType}`, 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.text(`Période: ${startDate} au ${endDate}`, 20, yPosition);
    yPosition += 15;
    
    // Tableau
    if (exportType === 'achats' && data.length > 0) {
      const tableData = data.flatMap(achat => 
        achat.items.map(item => [
          achat.date,
          item.type,
          item.denomination,
          item.quantite,
          `${item.prixUnitaire} €`,
          `${item.total} €`,
          achat.vendeur
        ])
      );
      
      doc.autoTable({
        startY: yPosition,
        head: [['Date', 'Type', 'Dénomination', 'Qte', 'Prix', 'Total', 'Vendeur']],
        body: tableData,
        theme: 'grid'
      });
    }
    
    doc.save(`${exportType}_${startDate}_${endDate}.pdf`);
  };

  const calculateTotals = () => {
    if (exportType === 'achats') {
      const total = data.reduce((sum, achat) => 
        sum + achat.items.reduce((itemSum, item) => itemSum + item.total, 0), 0
      );
      return total;
    } else if (exportType === 'ventes') {
      const total = data.reduce((sum, vente) => sum + vente.total, 0);
      return total;
    }
    return 0;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold mb-6">Export des Données</h1>
      
      {/* Sélecteurs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Type d'export</label>
          <select
            className="w-full p-2 border rounded"
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
          >
            <option value="achats">Achats</option>
            <option value="ventes">Ventes</option>
            <option value="stock">Stock</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Date début</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Date fin</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        
        <div className="flex items-end">
          <button
            onClick={loadData}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Nombre d'entrées</div>
              <div className="text-xl font-bold">{data.length}</div>
            </div>
            
            {(exportType === 'achats' || exportType === 'ventes') && (
              <div>
                <div className="text-sm text-gray-600">Total {exportType}</div>
                <div className="text-xl font-bold text-green-600">
                  {calculateTotals().toFixed(2)} €
                </div>
              </div>
            )}
            
            <div>
              <div className="text-sm text-gray-600">Date d'extraction</div>
              <div className="text-lg">{new Date().toLocaleDateString('fr-FR')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'export */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={exportToExcel}
          className="flex-1 bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Exporter en Excel
        </button>
        
        <button
          onClick={exportToPDF}
          className="flex-1 bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Exporter en PDF
        </button>
      </div>

      {/* Aperçu des données */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {exportType === 'achats' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendeur</th>
                </>
              )}
              {exportType === 'ventes' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode Paiement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </>
              )}
              {exportType === 'stock' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dénomination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix Achat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix Vente</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exportType === 'achats' && data.slice(0, 10).map((achat, idx) => 
              achat.items.map((item, itemIdx) => (
                <tr key={`${idx}-${itemIdx}`}>
                  <td className="px-6 py-4">{achat.date}</td>
                  <td className="px-6 py-4">{item.type} - {item.denomination}</td>
                  <td className="px-6 py-4">{item.quantite}</td>
                  <td className="px-6 py-4">{item.prixUnitaire.toFixed(2)} €</td>
                  <td className="px-6 py-4">{item.total.toFixed(2)} €</td>
                  <td className="px-6 py-4">{achat.vendeur}</td>
                </tr>
              ))
            )}
            
            {exportType === 'ventes' && data.slice(0, 10).map((vente, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4">{vente.date}</td>
                <td className="px-6 py-4">{vente.client}</td>
                <td className="px-6 py-4">{vente.modePaiement}</td>
                <td className="px-6 py-4">{vente.total.toFixed(2)} €</td>
              </tr>
            ))}
            
            {exportType === 'stock' && data.slice(0, 10).map((produit, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4">{produit.type}</td>
                <td className="px-6 py-4">{produit.denomination}</td>
                <td className="px-6 py-4">{produit.stock}</td>
                <td className="px-6 py-4">{produit.prixAchat.toFixed(2)} €</td>
                <td className="px-6 py-4">{produit.prixVente.toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {data.length > 10 && (
          <div className="text-center py-4 text-gray-500">
            {data.length - 10} entrées supplémentaires...
          </div>
        )}
      </div>
    </div>
  );
};

export default Export;