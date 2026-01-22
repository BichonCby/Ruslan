// src/components/Export.jsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import db from '../utils/database';
import '../styles/Export.css';

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
          .between(startDate, endDate, true, true)
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
          .between(startDate, endDate, true, true)
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
	// Préparer les données avant le rendu dans votre composant
	const prepareTableAchats = (achats) => {
		const tableRows = [];
		let currentDate = null;
		let dailyTotal = 0;
		let periodTotal = 0;
		
		achats.forEach((achat) => {
			// Vérifier si c'est une nouvelle date
			if (achat.date !== currentDate) {
				// Ajouter le total de la date précédente si elle existe
				if (currentDate !== null) {
					tableRows.push({
						type: 'total',
						date: currentDate,
						total: dailyTotal
					});
				}
				currentDate = achat.date;
				dailyTotal = 0;
			}
			
			// Ajouter les items
			achat.items.forEach((item, itemIndex) => {
				tableRows.push({
					type: 'item',
					achat,
					item,
					isFirstItem: itemIndex === 0
				});
			});
			
			// Ajouter au total journalier
			dailyTotal += achat.total;
			periodTotal += achat.total;
		});
		
		// Ajouter le total du dernier jour
		if (currentDate !== null) {
			tableRows.push({
				type: 'total',
				date: currentDate,
				total: dailyTotal
			});
			tableRows.push({
				type: 'full',
				date: 'TOTAL',
				total: periodTotal
			});
		}
		
		return tableRows;
	};

	// Dans votre composant
	const tableData = exportType === 'achats' ? prepareTableAchats(data) : [];

  return (
    <div className="export-container">
      <h1 className="export-title">Export des Données</h1>
      
      {/* Sélecteurs */}
      <div className="stats-container">
        <div>
          <label className="block text-sm font-medium mb-1">Type d'export</label>
          <select
            className="w-full p-2 border rounded"
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
          >
            <option value="achats">Achats</option>
            <option value="ventes">Ventes</option>
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
        
      </div>

      {/* Boutons d'export */}
      <div className="stats-container">
				<button
					onClick={loadData}
					className="btn btn-refresh"
				>
          <img src="renew.svg" height="40" width="40"></img>
				</button>
         <button
          onClick={exportToExcel}
          className="btn btn-refresh"
        >
          <svg className="stat-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <img src="excel.svg" height="40" width="40"></img>
        </button>
        <button
          onClick={exportToPDF}
          className="btn btn-refresh"
        >
          <svg className="stat-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <img src="pdf.svg" height="40" width="40"></img>
        </button>
      </div>

      {/* Aperçu des données */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" border="1">
          <thead >
            <tr>
              {exportType === 'achats' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facture</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendeur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commentaire 1</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commentaire 2</th>
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
            </tr>
          </thead>
          <tbody className="bg-green divide-y divide-blue-200">
            {exportType === 'ventes' && data.slice(0, 10).map((vente, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4">{vente.date}</td>
                <td className="px-6 py-4">{vente.client}</td>
                <td className="px-6 py-4">{vente.modePaiement}</td>
                <td className="px-6 py-4">{vente.total.toFixed(0)} ₽</td>
              </tr>
            ))}
            
					<tr>
					</tr>
						{tableData.map((row, index) => {
							if (row.type === 'item') {
								const { achat, item, isFirstItem } = row;
								
								return (
									<tr key={`item-${index}`}>
										<td bgcolor= "#fe293b">{isFirstItem ? achat.date : ''}</td>
										<td className="px-6 py-4">{isFirstItem ? achat.heure : ''}</td>
										<td className="prix-cell">{isFirstItem ? achat.total : ''}{isFirstItem ? '₽' : ''}</td>
										<td className="px-6 py-4">{isFirstItem ? achat.facture : ''}</td>
										<td className="px-6 py-4">{item.type}</td>
										<td className="px-6 py-4">{item.denomination}</td>
										<td className="px-6 py-4">{item.commission}</td>
										<td className="px-6 py-4">{item.quantite}</td>
										<td className="prix-cell">{item.prixUnitaire.toFixed(0)} ₽</td>  
										<td className="prix-cell">{item.total.toFixed(0)} ₽</td>
										<td className="px-6 py-4">{isFirstItem ? achat.vendeur : ''}</td>
										<td className="px-6 py-4">{isFirstItem ? achat.commentaire1 : ''}</td>
										<td className="px-6 py-4">{isFirstItem ? achat.commentaire2 : ''}</td>
									</tr> 
								);
							} else {
								return (
									<tr key={`total-${index}`} className="bg-gray-100 font-bold">
										<td colSpan={2} className="daily-cell">
											{row.date}
										</td>
										<td colSpan={1} className="daily-total-cell">
											{row.total.toFixed(0)} ₽
										</td>
										<td colSpan={10} className="daily-cell">
											
										</td>
									</tr>
								);
							}
						})}
					</tbody>					
        </table>
        
        {data.length > 1000 && (
          <div className="text-center py-4 text-gray-500">
            {data.length - 1000} entrées supplémentaires...
          </div>
        )}
      </div>
    </div>
  );
};

export default Export;