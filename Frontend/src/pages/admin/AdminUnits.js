// src/pages/admin/AdminUnits.js
import React, { useState, useEffect } from 'react';
import { getAdminUnits, createUnit, updateUnit, archiveUnit } from '../../services/adminService';
import UnitModal from '../../components/admin/UnitModal';
import { Plus, Edit, Archive, ExternalLink } from 'lucide-react';
import '../../styles/AdminUnits.css';

function AdminUnits({ onUnitSelect }) {
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUnit, setCurrentUnit] = useState(null);
  
  // Fetch active units data only
  useEffect(() => {
    async function fetchUnits() {
      try {
        setIsLoading(true);
        // Update the API call to fetch only active units (not archived)
        const data = await getAdminUnits(false);
        setUnits(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load units');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUnits();
  }, []);
  
  // Handle opening the add unit modal
  const handleAddUnit = () => {
    setCurrentUnit(null);
    setShowModal(true);
  };
  
  // Handle opening the edit unit modal
  const handleEditUnit = (unit) => {
    setCurrentUnit(unit);
    setShowModal(true);
  };
  
  // Handle saving a unit (create or update)
  const handleSaveUnit = async (unitData) => {
    try {
      let updatedUnit;
      
      if (currentUnit) {
        // Update existing unit
        updatedUnit = await updateUnit(currentUnit.id, unitData);
        // Update the units list
        setUnits(units.map(u => u.id === updatedUnit.id ? updatedUnit : u));
      } else {
        // Create new unit
        updatedUnit = await createUnit(unitData);
        // Add to the units list
        setUnits([...units, updatedUnit]);
      }
      
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save unit');
    }
  };
  
  // Handle archiving a unit
  const handleArchiveUnit = async (unitId) => {
    if (window.confirm('Are you sure you want to archive this unit? It will no longer be visible in the dashboard.')) {
      try {
        await archiveUnit(unitId);
        // Remove the archived unit from the list
        setUnits(units.filter(u => u.id !== unitId));
      } catch (err) {
        setError(err.message || 'Failed to archive unit');
      }
    }
  };
  
  if (isLoading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading units...</p>
    </div>
  );
  
  return (
    <div className="admin-units">
      <div className="admin-controls">
        <h2>Units Management</h2>
        <button className="add-button" onClick={handleAddUnit}>
          <Plus size={16} />
          <span>Add Unit</span>
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {units.length === 0 ? (
        <div className="no-data">
          <p>No units found.</p>
          <button className="add-button-center" onClick={handleAddUnit}>
            <Plus size={16} />
            <span>Add Your First Unit</span>
          </button>
        </div>
      ) : (
        <div className="units-grid">
          {units.map(unit => (
            <div key={unit.id} className="unit-card">
              <div className="unit-header">
                <h3>{unit.title}</h3>
                <div className="unit-actions">
                  <button 
                    className="edit-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditUnit(unit);
                    }}
                    title="Edit unit"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className="archive-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveUnit(unit.id);
                    }}
                    title="Archive unit"
                  >
                    <Archive size={14} />
                  </button>
                </div>
              </div>
              <p className="unit-description">{unit.description || 'No description'}</p>
              <div className="unit-footer">
                <div className="unit-metadata">
                  <span className="unit-status">Status: {unit.status}</span>
                  <span className="unit-order">Order: {unit.order_index}</span>
                </div>
                <button 
                  className="open-button"
                  onClick={() => onUnitSelect(unit)}
                  title="Open lessons"
                >
                  <ExternalLink size={14} />
                  <span>Open</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showModal && (
        <UnitModal 
          unit={currentUnit}
          onClose={() => setShowModal(false)}
          onSave={handleSaveUnit}
        />
      )}
    </div>
  );
}

export default AdminUnits;