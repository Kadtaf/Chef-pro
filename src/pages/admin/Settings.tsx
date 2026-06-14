import { useEffect, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Save, ChevronLeft, Globe, Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Image, FileText } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    site_name: '',
    site_description: '',
    email: '',
    phone: '',
    address: '',
    logo_url: '',
    banner_url: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        site_name: settings.site_name || '',
        site_description: settings.site_description || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        logo_url: settings.logo_url || '',
        banner_url: settings.banner_url || '',
        facebook_url: settings.facebook_url || '',
        instagram_url: settings.instagram_url || '',
        linkedin_url: settings.linkedin_url || '',
        seo_title: settings.seo_title || '',
        seo_description: settings.seo_description || '',
        seo_keywords: settings.seo_keywords || '',
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateSettings(formData);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-neutral-900">Paramètres du site</h1>
        <p className="text-neutral-500">Configuration globale du site vitrine</p>
      </div>

      {success && (
        <div className="p-4 rounded-lg bg-success-50 border border-success-200 text-success-700">
          Paramètres enregistrés avec succès !
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Informations générales</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="label">Nom du site</label><input type="text" value={formData.site_name} onChange={e => setFormData({ ...formData, site_name: e.target.value })} className="input" /></div>
            <div><label className="label">Description</label><input type="text" value={formData.site_description} onChange={e => setFormData({ ...formData, site_description: e.target.value })} className="input" /></div>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Phone className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="label"><Mail className="w-4 h-4 inline mr-1" />Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="input" /></div>
            <div><label className="label"><Phone className="w-4 h-4 inline mr-1" />Téléphone</label><input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input" /></div>
            <div className="md:col-span-2"><label className="label"><MapPin className="w-4 h-4 inline mr-1" />Adresse</label><input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="input" /></div>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Facebook className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Réseaux sociaux</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="label"><Facebook className="w-4 h-4 inline mr-1" />Facebook</label><input type="url" value={formData.facebook_url} onChange={e => setFormData({ ...formData, facebook_url: e.target.value })} className="input" placeholder="https://facebook.com/..." /></div>
            <div><label className="label"><Instagram className="w-4 h-4 inline mr-1" />Instagram</label><input type="url" value={formData.instagram_url} onChange={e => setFormData({ ...formData, instagram_url: e.target.value })} className="input" placeholder="https://instagram.com/..." /></div>
            <div><label className="label"><Linkedin className="w-4 h-4 inline mr-1" />LinkedIn</label><input type="url" value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} className="input" placeholder="https://linkedin.com/..." /></div>
          </div>
        </div>

        {/* Images */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Image className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Images</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="label">Logo URL</label><input type="url" value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} className="input" /></div>
            <div><label className="label">Bannière URL</label><input type="url" value={formData.banner_url} onChange={e => setFormData({ ...formData, banner_url: e.target.value })} className="input" /></div>
          </div>
        </div>

        {/* SEO */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">SEO</h2>
          </div>
          <div className="space-y-6">
            <div><label className="label">Titre SEO</label><input type="text" value={formData.seo_title} onChange={e => setFormData({ ...formData, seo_title: e.target.value })} className="input" /></div>
            <div><label className="label">Description SEO</label><textarea rows={3} value={formData.seo_description} onChange={e => setFormData({ ...formData, seo_description: e.target.value })} className="input resize-none" /></div>
            <div><label className="label">Mots-clés (séparés par des virgules)</label><input type="text" value={formData.seo_keywords} onChange={e => setFormData({ ...formData, seo_keywords: e.target.value })} className="input" /></div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary gap-2" disabled={saving}>
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
