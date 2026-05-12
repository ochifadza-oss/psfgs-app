import { useState, useEffect, useRef, FormEvent } from 'react';
import { getEntitySettings, updateEntitySettings, uploadEntityLogo } from '../services/api';

interface EntitySettings {
  entity_id: number;
  entity_name: string;
  logo_path: string | null;
  abbreviation: string | null;
  demarcation_code: string | null;
  entity_type: string;
  legislation_type: string;
  province: string | null;
  financial_year_end: number;
  physical_address: string | null;
  postal_address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  municipal_manager: string | null;
  cfo_name: string | null;
  mayor_name: string | null;
  speaker_name: string | null;
}

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
];

const ENTITY_TYPES = ['Metropolitan', 'District', 'Local', 'Provincial', 'National'];

interface SettingsProps {
  onBrandingChange?: () => void;
}

export function Settings({ onBrandingChange }: SettingsProps) {
  const [entity, setEntity] = useState<EntitySettings | null>(null);
  const [form, setForm] = useState<Partial<EntitySettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'leadership'>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getEntitySettings();
      setEntity(res.data);
      setForm(res.data);
    } catch {
      // Empty fallback
      const demo: EntitySettings = {
        entity_id: 0, entity_name: '', logo_path: null,
        abbreviation: '', demarcation_code: '', entity_type: 'Metropolitan',
        legislation_type: 'MFMA', province: null, financial_year_end: 6,
        physical_address: null, postal_address: null,
        phone: null, fax: null,
        email: null, website: null,
        municipal_manager: null, cfo_name: null, mayor_name: null, speaker_name: null,
      };
      setEntity(demo);
      setForm(demo);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EntitySettings, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await updateEntitySettings(form);
      setEntity(res.data);
      setForm(res.data);
      setMessage({ type: 'success', text: 'Entity settings saved successfully.' });
      onBrandingChange?.();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadEntityLogo(file);
      setForm((prev) => ({ ...prev, logo_path: res.data.logo_path }));
      setEntity((prev) => prev ? { ...prev, logo_path: res.data.logo_path } : prev);
      setMessage({ type: 'success', text: 'Logo uploaded successfully.' });
      onBrandingChange?.();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to upload logo.' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#5A6478' }}>Loading settings...</div>;

  const logoUrl = form.logo_path || null;

  return (
    <div>
      {message && (
        <div style={{
          padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13,
          background: message.type === 'success' ? '#eef8f2' : '#FFF0EC',
          color: message.type === 'success' ? '#1A6B3C' : '#8B2500',
          border: `1px solid ${message.type === 'success' ? '#1A6B3C' : '#8B2500'}22`,
        }}>
          {message.text}
        </div>
      )}

      {/* Logo and Entity Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 100, height: 100, borderRadius: 12,
              border: '2px dashed #DDE2EB', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
              background: logoUrl ? 'transparent' : '#F4F6F9', flexShrink: 0,
            }}
            title="Click to upload logo"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Entity logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#8B93A7', fontSize: 11 }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>+</div>
                Upload Logo
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleLogoUpload}
            style={{ display: 'none' }}
          />
          <div>
            <h2 style={{ fontSize: 20, color: '#1F3864', marginBottom: 4 }}>
              {form.entity_name || 'Entity Name'}
            </h2>
            <div style={{ fontSize: 13, color: '#5A6478' }}>
              {form.entity_type} Municipality &middot; {form.abbreviation || ''} &middot; {form.demarcation_code || ''}
            </div>
            <div style={{ fontSize: 12, color: '#8B93A7', marginTop: 4 }}>
              {form.province} &middot; {form.legislation_type} &middot; FY ends {['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][form.financial_year_end || 6]}
            </div>
            {uploading && <div style={{ fontSize: 11, color: '#2E75B6', marginTop: 4 }}>Uploading logo...</div>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['general', 'contact', 'leadership'] as const).map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'general' ? 'General Information' : tab === 'contact' ? 'Contact & Address' : 'Leadership'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {activeTab === 'general' && (
          <div className="card">
            <h3 style={{ fontSize: 14, color: '#1F3864', marginBottom: 16 }}>General Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Entity Name</label>
                <input className="form-input" value={form.entity_name || ''} onChange={(e) => handleChange('entity_name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Abbreviation</label>
                <input className="form-input" value={form.abbreviation || ''} onChange={(e) => handleChange('abbreviation', e.target.value)} placeholder="e.g. BCMM" />
              </div>
              <div className="form-group">
                <label className="form-label">Demarcation Code</label>
                <input className="form-input" value={form.demarcation_code || ''} onChange={(e) => handleChange('demarcation_code', e.target.value)} placeholder="e.g. DC12" />
              </div>
              <div className="form-group">
                <label className="form-label">Entity Type</label>
                <select className="form-input" value={form.entity_type || ''} onChange={(e) => handleChange('entity_type', e.target.value)}>
                  {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Legislation Type</label>
                <select className="form-input" value={form.legislation_type || ''} onChange={(e) => handleChange('legislation_type', e.target.value)}>
                  <option value="MFMA">MFMA</option>
                  <option value="PFMA">PFMA</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Province</label>
                <select className="form-input" value={form.province || ''} onChange={(e) => handleChange('province', e.target.value)}>
                  <option value="">Select Province</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Financial Year End (Month)</label>
                <select className="form-input" value={form.financial_year_end || 6} onChange={(e) => handleChange('financial_year_end', parseInt(e.target.value))}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                    <option key={m} value={m}>{['January','February','March','April','May','June','July','August','September','October','November','December'][m-1]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="card">
            <h3 style={{ fontSize: 14, color: '#1F3864', marginBottom: 16 }}>Contact & Address</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Physical Address</label>
                <textarea className="form-input" rows={2} value={form.physical_address || ''} onChange={(e) => handleChange('physical_address', e.target.value)} placeholder="Street address" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Postal Address</label>
                <textarea className="form-input" rows={2} value={form.postal_address || ''} onChange={(e) => handleChange('postal_address', e.target.value)} placeholder="Postal address" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} placeholder="e.g. 043 701 4000" />
              </div>
              <div className="form-group">
                <label className="form-label">Fax</label>
                <input className="form-input" value={form.fax || ''} onChange={(e) => handleChange('fax', e.target.value)} placeholder="e.g. 043 743 2000" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email || ''} onChange={(e) => handleChange('email', e.target.value)} placeholder="info@municipality.gov.za" />
              </div>
              <div className="form-group">
                <label className="form-label">Website</label>
                <input className="form-input" value={form.website || ''} onChange={(e) => handleChange('website', e.target.value)} placeholder="www.municipality.gov.za" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leadership' && (
          <div className="card">
            <h3 style={{ fontSize: 14, color: '#1F3864', marginBottom: 16 }}>Leadership</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Municipal Manager / Accounting Officer</label>
                <input className="form-input" value={form.municipal_manager || ''} onChange={(e) => handleChange('municipal_manager', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Chief Financial Officer (CFO)</label>
                <input className="form-input" value={form.cfo_name || ''} onChange={(e) => handleChange('cfo_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Executive Mayor</label>
                <input className="form-input" value={form.mayor_name || ''} onChange={(e) => handleChange('mayor_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Speaker</label>
                <input className="form-input" value={form.speaker_name || ''} onChange={(e) => handleChange('speaker_name', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '10px 32px' }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button type="button" className="btn" onClick={loadSettings} style={{ padding: '10px 24px' }}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
