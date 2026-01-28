// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { initDatabase } from './utils/database';
import Sidebar from './components/Sidebar';
import Achats from './components/Achats';
import Ventes from './components/Ventes';
import Stock from './components/Stock';
import Export from './components/Export';
import Vendeurs from './components/Vendeurs';
import './styles/App.css';
import labels from './utils/label'

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
	const [language,setLanguage] = useState('fr');
	const [label,setLabel] = useState(labels.fr);
	
  // Utiliser une ref pour éviter les doubles initialisations
  const initStarted = useRef(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Éviter de démarrer l'initialisation si elle a déjà commencé
      if (initStarted.current) return;
      initStarted.current = true;
      
      setIsLoading(true);
      try {
				if (!dbInitialized){
					await initDatabase();
					setDbInitialized(true);
				}
				setError(null);
      } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        setError('Erreur lors du chargement de la base de données');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
    // Cleanup function
    return () => {
      // Réinitialiser si le composant est démonté
      initStarted.current = false;
    };
  }, [dbInitialized]);

  useEffect(() => {
		//console.log('langue : '+language);
		if (language == 'fr'){
			setLabel(labels.fr);
		}
		else {
			setLabel(labels.ru);
		}
		//console.log('langue : '+language);

	},[language]);
	
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement de l'application...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Erreur de chargement</h2>
          <p className="error-message">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-retry"
          >
            Réessayer
          </button>
        </div>
      );
    }

    if (!dbInitialized) {
      return (
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2 className="error-title">Base de données indisponible</h2>
          <p className="error-message">Impossible de charger les données.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'achats':
        return <Achats label={label}/>;
      case 'ventes':
        return <Ventes label={label} />;
      case 'stock':
        return <Stock label={label} />;
      case 'export':
        return <Export label={label} />;
      case 'vendeurs':
        return <Vendeurs label={label} />;
			case 'home':
				return(
				<div>
					<div className="title-home"> {label.title} </div>
					<div >
						<img src="couple.jpg" className="center-image"></img>
					</div>
        </div>
					);
      default:
        return (
          <div className="no-content">
            <h2>Page non trouvée</h2>
            <p>La page demandée n'existe pas.</p>
          </div>
        );
    }
  };

  return (
    <div className="app">
      {!isLoading && !error && dbInitialized && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} label={label} language={language} setLanguage={setLanguage} />
      )}
      
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Notification de succès de PWA */}
      <div id="pwa-install-notification" className="pwa-notification">
        <div className="pwa-notification-content">
          <p>Installez cette application pour une meilleure expérience !</p>
          <button id="pwa-install-btn" className="btn btn-install">
            Installer
          </button>
          <button id="pwa-dismiss-btn" className="btn btn-dismiss">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;