
// src/components/ZeroHeartsModal.js
import React from 'react';
import HeartModal from './HeartModal';

function ZeroHeartsModal({ onClose, onPurchase }) {
  return <HeartModal onClose={onClose} onPurchase={onPurchase} isZero={true} />;
}

export default ZeroHeartsModal;