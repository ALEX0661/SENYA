// src/pages/HeartsShop.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserStatus } from '../services/userService';
import { purchaseHearts, getHeartPackages } from '../services/shopService';
import '../styles/HeartsShop.css';

function HeartsShop() {
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState({
    hearts: 0,
    rubies: 0,
    streak: 0
  });
  const [heartPackages, setHeartPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both user data and heart packages in parallel
        const [status, packages] = await Promise.all([
          getUserStatus(),
          getHeartPackages()
        ]);
        
        setUserStatus(status);
        setHeartPackages(packages);
      } catch (err) {
        setErrorMessage("Failed to load data. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const handlePurchase = async (packageId) => {
    const selectedPackage = heartPackages.find(pkg => pkg.id === packageId);
    
    if (!selectedPackage) return;
    
    if (userStatus.rubies < selectedPackage.ruby_cost) {
      setErrorMessage("Not enough rubies for this purchase!");
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    // Check if user already has max hearts
    if (userStatus.hearts >= 5) {
      setErrorMessage("You already have maximum hearts!");
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    try {
      const result = await purchaseHearts(packageId);
      
      // Update local state with new values
      setUserStatus({
        ...userStatus,
        hearts: result.hearts,
        rubies: result.rubies
      });
      
      setSuccessMessage(`Successfully purchased ${selectedPackage.hearts_amount} hearts!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      if (err.response?.data?.detail) {
        setErrorMessage(err.response.data.detail);
      } else {
        setErrorMessage("Failed to complete purchase. Please try again.");
      }
      console.error(err);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="hearts-shop-container">
      <header className="shop-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Hearts Shop</h1>
        <div className="user-resources">
          <span className="rubies-count">💎 {userStatus.rubies} rubies</span>
          <span className="hearts-count">❤️ {userStatus.hearts}/5 hearts</span>
        </div>
      </header>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="packages-container">
        {heartPackages.map((pkg) => (
          <div className="package-card" key={pkg.id}>
            <h3>{pkg.name}</h3>
            <div className="package-details">
              <p className="hearts-amount">❤️ {pkg.hearts_amount} heart{pkg.hearts_amount > 1 ? 's' : ''}</p>
              <p className="price">💎 {pkg.ruby_cost} rubies</p>
            </div>
            <button 
              className="purchase-button" 
              onClick={() => handlePurchase(pkg.id)}
              disabled={userStatus.rubies < pkg.ruby_cost || userStatus.hearts >= 5}
            >
              Purchase
            </button>
          </div>
        ))}
      </div>
      
      <div className="hearts-info">
        <p>Hearts refill at a rate of 1 heart every 10 minutes.</p>
        <p>Maximum hearts: 5</p>
      </div>
    </div>
  );
}

export default HeartsShop;