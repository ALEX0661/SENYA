// src/components/NoHeartsModal.js
import React from 'react';
import HeartModal from './HeartModal';

function NoHeartsModal({ onClose }) {
  return <HeartModal onClose={onClose} onPurchase={onClose} isZero={false} />;
}

export default NoHeartsModal;
