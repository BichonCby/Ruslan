// src/components/Sidebar.jsx
import React from 'react';
import labels from '../utils/label.js'
import lang from '../utils/label.js'
import '../styles/Sidebar.css'

const Sidebar = ({ activeTab, setActiveTab, label,language,setLanguage}) => {

  const tabs = [
    { id: 'achats', label: label.sideAchat, icon: '📥' },
    { id: 'ventes', label: label.sideVente, icon: '📤' },
    { id: 'stock', label: label.sideStock, icon: '📊' },
    { id: 'export', label: label.sideExport, icon: '💾' },
    { id: 'vendeurs', label: label.sideVendeurs, icon: '🧍🏻' }
  ];
	const changeLanguage = () => {
		if (language ==='fr'){
			setLanguage('ru');
		}
		else {
			setLanguage('fr');
		}
	}
  return (
    <div className="sidebar">
      <div className="sidebar-content">
				<button
					onClick={() => setActiveTab('home')}
				>
					<h1 className="sidebar-title">{label.title}</h1>
        </button>
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {tabs.map(tab => (
              <li key={tab.id} className="sidebar-menu-item">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`sidebar-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <span className="sidebar-icon">{tab.icon}</span>
                  <span className="sidebar-label">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="sidebar-info">
            <p className="sidebar-app-name">PWA Magasin</p>
            <p className="sidebar-version">Version 1.0</p>
          </div>
					<button
						className='side-lang-btn '
						
					  onClick={() => changeLanguage()}
					>
						<span> {language==='fr'?'FR':'РУ'}</span>
						</button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;