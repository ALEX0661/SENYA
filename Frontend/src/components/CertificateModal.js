import React from 'react';
import '../styles/CertificateModal.css';

function CertificateModal({ isOpen, onClose, certificateData }) {
  if (!isOpen) return null;
  
  const { name, issue_date, certificate_id } = certificateData;
  const formattedDate = new Date(issue_date).toLocaleDateString();
  
  return (
    <div className="modal-overlay">
      <div className="certificate-modal">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="certificate-content">
          <div className="certificate-header">
            <h1>Certificate of Completion</h1>
            <h2>Senya Sign Language</h2>
          </div>
          
          <div className="certificate-body">
            <p className="certificate-text">This is to certify that</p>
            <p className="certificate-name">{name}</p>
            <p className="certificate-text">
              has successfully completed all lessons and requirements
              of the Senya Sign Language curriculum.
            </p>
            
            <div className="certificate-footer">
              <div className="certificate-date">
                <p className="date-label">Issue Date:</p>
                <p className="date-value">{formattedDate}</p>
              </div>
              <div className="certificate-signature">
                <p className="signature-line">____________________</p>
                <p className="signature-name">Program Director</p>
              </div>
              <div className="certificate-id">
                <p className="id-label">Certificate ID:</p>
                <p className="id-value">{certificate_id}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="certificate-actions">
          <button className="download-button" onClick={() => window.print()}>
            Download Certificate
          </button>
        </div>
      </div>
    </div>
  );
}

export default CertificateModal;