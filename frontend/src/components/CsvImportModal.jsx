import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertTriangle, Download, Copy } from 'lucide-react';
import { api } from '../api/client';

export default function CsvImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a valid CSV file.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const data = await api.transactions.importCsv(file);
      setResult(data);
      onImportSuccess();
    } catch (err) {
      setError(err.message || 'CSV Import failed. Please check the file structure.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleCsv = `Date,Description,Merchant,Amount,Category,PaymentMethod
2026-10-01,Campus canteen breakfast and masala dosa,College Canteen,85,Food & Dining,UPI
2026-10-01,Delhi Metro recharge card,DMRC Metro,200,Travel & Commute,UPI
2026-10-02,Swiggy paneer butter masala lunch,Swiggy,260,Food & Dining,UPI
2026-10-03,Jio 5G Unlimited 1 Month Recharge,Jio Infocomm,239,Utilities & Bills,UPI
2026-10-04,Uber ride from college to hostel,Uber,145,Travel & Commute,UPI
2026-10-05,Tapri cutting chai and bun maska,Chai Point,70,Food & Dining,UPI
2026-10-05,Tapri cutting chai and bun maska,Chai Point,70,Food & Dining,UPI
2026-10-06,Spotify Student Premium Plan,Spotify,59,Subscriptions & Streaming,Card
2026-10-08,PVR weekend cinema movie ticket and nachos,PVR Cinemas,340,Entertainment & Outings,UPI
2026-10-12,Netflix Monthly Ultra HD Subscription,Netflix India,649,Subscriptions & Streaming,Card
2026-10-13,Netflix Monthly Ultra HD Subscription,Netflix India,649,Subscriptions & Streaming,Card
2026-10-15,Grand Luxury Rooftop Nightclub & Lounge Party,Skyline Lounge,5800,Food & Dining,Card`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_college_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Import CSV Bank Statement</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Batch parses transactions, applies AI categorization & Isolation Forest scan
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--rose-surface)',
            border: '1px solid var(--rose-border)',
            color: '#fda4af',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {result ? (
          /* Success Result State */
          <div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '4px' }}>
                Successfully Imported {result.imported_count} Transactions!
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                All records categorized by NLP model and scanned for outliers.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fb7185', fontSize: '0.8rem', fontWeight: 600 }}>
                  <AlertTriangle size={15} /> Anomalies Detected
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                  {result.anomalies_detected}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Copy size={15} /> Duplicates Found
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                  {result.duplicates_found}
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={onClose}
            >
              Done & View Transactions
            </button>
          </div>
        ) : (
          /* File Upload State */
          <div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(255,255,255,0.15)',
                borderRadius: '14px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
                marginBottom: '16px'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
            >
              <UploadCloud size={40} color="var(--primary)" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                {file ? file.name : 'Click to upload or drag & drop CSV file'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Supports bank statements from SBI, HDFC, ICICI, Paytm, GPay, or custom CSV
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadSample}
              >
                <Download size={14} /> Download Sample College Statement CSV
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={uploading || !file}
              >
                {uploading ? 'Processing AI Models...' : 'Import & Run Anomaly Scan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
