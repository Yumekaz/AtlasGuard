'use client';

import { useState } from 'react';
import { EvidenceFile } from '@atlasguard/shared';
import { apiUpload } from '../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

interface EvidenceUploadProps {
  incidentId: string;
  evidence: EvidenceFile[];
  onUploaded: (file: EvidenceFile) => void;
}

export function EvidenceUpload({ incidentId, evidence, onUploaded }: EvidenceUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Select a file to upload');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      if (description) form.append('description', description);
      const uploaded = await apiUpload<EvidenceFile>(`/incidents/${incidentId}/evidence`, form);
      onUploaded(uploaded);
      setFile(null);
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Evidence</h3>

      {evidence.length > 0 && (
        <ul style={{ listStyle: 'none', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {evidence.map((item) => (
            <li key={item.id} className="glass" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
              <strong style={{ color: '#fff' }}>{item.fileType}</strong>
              {item.uploadedByName && (
                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  by {item.uploadedByName}
                </span>
              )}
              {item.description && (
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
                  {item.description}
                </p>
              )}
              <a
                href={`${API_BASE}${item.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary)', fontSize: '0.8rem', display: 'inline-block', marginTop: '0.35rem' }}
              >
                View file
              </a>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="file"
          accept="image/jpeg,image/png,text/plain"
          className="form-input"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>{error}</p>}
        <button type="submit" disabled={uploading} className="btn btn-secondary" style={{ width: 'auto' }}>
          {uploading ? 'Uploading...' : 'Upload Evidence'}
        </button>
      </form>
    </div>
  );
}