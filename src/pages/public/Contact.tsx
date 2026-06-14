import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function Contact() {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('contact_submissions').insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      subject: formData.subject || null,
      message: formData.message,
    });
    if (!error) {
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <div className="card p-8 max-w-md text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-4">Message envoyé !</h2>
          <p className="text-neutral-600 mb-6">Merci pour votre message. Je vous répondrai dans les plus brefs délais.</p>
          <Link to="/" className="btn-primary">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-neutral-900 to-neutral-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Contact
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Discutons de votre projet culinaire
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <div className="card p-8">
              <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-6">
                Envoyez-moi un message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="label">Nom complet *</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="label">Email *</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      placeholder="email@exemple.fr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="label">Téléphone</label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                      placeholder="06 00 00 00 00"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="label">Sujet</label>
                    <select
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="input"
                    >
                      <option value="">Sélectionnez un sujet</option>
                      <option value="chef">Chef de cuisine</option>
                      <option value="second">Second de cuisine</option>
                      <option value="consulting">Consulting</option>
                      <option value="formation">Formation</option>
                      <option value="evenementiel">Événementiel</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="label">Message *</label>
                  <textarea
                    id="message"
                    rows={6}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input resize-none"
                    placeholder="Décrivez votre projet..."
                  />
                </div>
                <button type="submit" className="btn-primary w-full gap-2" disabled={loading}>
                  {loading ? 'Envoi en cours...' : 'Envoyer'}
                  {!loading && <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>

            {/* Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-6">
                  Informations de contact
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">Adresse</h3>
                      <p className="text-neutral-600">{settings?.address || 'Bordeaux, France'}</p>
                      <p className="text-sm text-neutral-500">Interventions sur Bordeaux et sa région</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">Téléphone</h3>
                      <a href={`tel:${settings?.phone}`} className="text-primary-600 hover:text-primary-700">
                        {settings?.phone || '+33 6 00 00 00 00'}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">Email</h3>
                      <a href={`mailto:${settings?.email}`} className="text-primary-600 hover:text-primary-700">
                        {settings?.email || 'contact@chef-pro-bordeaux.fr'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6 bg-gradient-to-br from-primary-50 to-secondary-50">
                <h3 className="font-semibold text-neutral-900 mb-2">Disponibilité</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Disponible du lundi au samedi, de 8h à 20h. Réponse sous 24h garantie.
                </p>
                <p className="text-xs text-neutral-500">
                  Les missions urgentes sont possibles, n'hésitez pas à me contacter.
                </p>
              </div>

              <div className="card p-6">
                <h3 className="font-semibold text-neutral-900 mb-4">Zone d'intervention</h3>
                <div className="flex flex-wrap gap-2">
                  {['Bordeaux', 'Métropole', 'Gironde', 'Nouvelle-Aquitaine', 'France'].map((zone) => (
                    <span key={zone} className="badge bg-neutral-100 text-neutral-600">{zone}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
