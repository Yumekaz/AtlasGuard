// apps/web/src/app/dashboard/tourist/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { apiRequest } from '../../../../lib/api';
import { TouristProfile } from '@atlasguard/shared';

export default function TouristProfilePage() {
  const { user, loading: authLoading } = useAuth(['TOURIST', 'ADMIN']);
  
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [mobilityNeeds, setMobilityNeeds] = useState('');
  const [languagePreference, setLanguagePreference] = useState('English');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    // Fetch existing profile
    apiRequest<TouristProfile>('/tourist/profile', 'GET')
      .then((profile) => {
        if (profile) {
          setPhone(profile.phone || '');
          setEmergencyContactName(profile.emergencyContactName || '');
          setEmergencyContactPhone(profile.emergencyContactPhone || '');
          setMedicalNotes(profile.medicalNotes || '');
          setMobilityNeeds(profile.mobilityNeeds || '');
          setLanguagePreference(profile.languagePreference || 'English');
        }
        setLoading(false);
      })
      .catch((err) => {
        // A 404 is normal if profile is not yet created
        setLoading(false);
      });
  }, [authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);

    try {
      await apiRequest<TouristProfile>('/tourist/profile', 'PUT', {
        phone,
        emergencyContactName,
        emergencyContactPhone,
        medicalNotes,
        mobilityNeeds,
        languagePreference,
      });

      setStatus({
        type: 'success',
        message: 'Your emergency safety profile has been successfully updated.',
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Failed to update safety profile. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="glass metric-card shimmer" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-secondary)' }}>Loading Profile Details...</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <div className="glass metric-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          Emergency Safety Profile
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          This information is critical for dispatching rescue teams and identifying medical constraints during an SOS event.
        </p>

        {status && (
          <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
            <strong>{status.type === 'success' ? 'Success: ' : 'Error: '}</strong>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="phone">My Contact Phone Number</label>
            <input
              id="phone"
              type="tel"
              className="form-input"
              placeholder="+1 555-019-2834"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid-cols-2" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="emergencyName">Emergency Contact Name</label>
              <input
                id="emergencyName"
                type="text"
                className="form-input"
                placeholder="Jane Doe"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="emergencyPhone">Emergency Contact Phone</label>
              <input
                id="emergencyPhone"
                type="tel"
                className="form-input"
                placeholder="+1 555-019-9988"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="language">Preferred Communication Language</label>
            <select
              id="language"
              className="form-select"
              value={languagePreference}
              onChange={(e) => setLanguagePreference(e.target.value)}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Hindi">Hindi</option>
              <option value="Nepali">Nepali</option>
              <option value="French">French</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="medical">Medical Constraints & Conditions</label>
            <textarea
              id="medical"
              className="form-input"
              rows={3}
              placeholder="e.g., Asthma (inhaler in backpack), Penicillin allergy, diabetes, cardiac history..."
              style={{ resize: 'vertical' }}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mobility">Mobility Constraints or Assistance Needs</label>
            <textarea
              id="mobility"
              className="form-input"
              rows={2}
              placeholder="e.g., Uses wheelchair, visual impairment, require physical assistance..."
              style={{ resize: 'vertical' }}
              value={mobilityNeeds}
              onChange={(e) => setMobilityNeeds(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '1rem' }}>
            {submitting ? 'Saving Profile...' : 'Save Safety Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
