import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import {
    ArrowLeft,
    Printer,
    Edit,
    CalendarDays,
    MapPin,
    Building2,
    Mail,
    Phone,
    BadgeEuro,
    Wallet,
    FileText,
    CheckCircle2,
    Clock3,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

type MissionRow = Tables<'missions'>;
type RevenueRow = Tables<'revenues'>;

function formatDate(value?: string | null) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('fr-FR');
}

function normalizeMissionType(type?: string | null) {
    switch (type) {
        case 'chef':
            return 'Chef';
        case 'second':
            return 'Second';
        case 'consulting':
            return 'Consulting';
        case 'formation':
            return 'Formation';
        case 'evenementiel':
            return 'Événementiel';
        default:
            return 'Mission';
    }
}

function renderStatus(status?: string | null) {
    switch (status) {
        case 'terminee':
            return {
                label: 'Terminée',
                className: 'badge bg-success-50 text-success-700 border border-success-200',
                icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            };
        case 'en_cours':
            return {
                label: 'En cours',
                className: 'badge bg-primary-50 text-primary-700 border border-primary-200',
                icon: <Clock3 className="w-3.5 h-3.5" />,
            };
        case 'annulee':
            return {
                label: 'Annulée',
                className: 'badge bg-error-50 text-error-700 border border-error-200',
                icon: <XCircle className="w-3.5 h-3.5" />,
            };
        default:
            return {
                label: 'En attente',
                className: 'badge bg-warning-50 text-warning-700 border border-warning-200',
                icon: <AlertCircle className="w-3.5 h-3.5" />,
            };
    }
}

export default function MissionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [mission, setMission] = useState<MissionRow | null>(null);
    const [revenues, setRevenues] = useState<RevenueRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMission = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            setLoading(true);

            const { data: missionData, error: missionError } = await supabase
                .from('missions')
                .select('*')
                .eq('id', id)
                .single();

            if (missionError) {
                console.error('Erreur chargement mission admin:', missionError);
                setLoading(false);
                return;
            }

            if (!missionData) {
                setLoading(false);
                return;
            }

            setMission(missionData);

            const { data: revenuesData, error: revenuesError } = await supabase
                .from('revenues')
                .select('*')
                .eq('mission_id', missionData.id)
                .order('date_received', { ascending: false });

            if (revenuesError) {
                console.error('Erreur chargement revenus mission:', revenuesError);
            }

            setRevenues(revenuesData ?? []);
            setLoading(false);
        };

        fetchMission();
    }, [id]);

    const status = useMemo(() => renderStatus(mission?.status), [mission?.status]);

    const totalRevenueReceived = useMemo(() => {
        return revenues.reduce((sum, revenue) => sum + Number(revenue.amount || 0), 0);
    }, [revenues]);

    const estimatedDuration = useMemo(() => {
        if (!mission?.start_date || !mission?.end_date) return null;
        const start = new Date(mission.start_date);
        const end = new Date(mission.end_date);
        const diffMs = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 0;
    }, [mission?.start_date, mission?.end_date]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!mission) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/missions')} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Mission introuvable
                        </h1>
                        <p className="text-neutral-500">
                            Cette mission n’existe pas ou n’est plus accessible.
                        </p>
                    </div>
                </div>

                <Link to="/admin/missions" className="btn-primary">
                    Retour à la liste
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <style>
                {`
          @media print {
            .no-print {
              display: none !important;
            }

            body {
              background: white !important;
            }

            .print-reset {
              box-shadow: none !important;
              border: 1px solid #e5e7eb !important;
            }

            .print-break-avoid {
              break-inside: avoid;
            }
          }
        `}
            </style>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 no-print">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/missions')} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Détail de la mission
                        </h1>
                        <p className="text-neutral-500">Consultation et impression</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={() => window.print()} className="btn-outline gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimer
                    </button>

                    <Link to={`/admin/missions/${mission.id}/edit`} className="btn-primary gap-2">
                        <Edit className="w-4 h-4" />
                        Modifier
                    </Link>
                </div>
            </div>

            <section className="rounded-2xl overflow-hidden print-reset bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white p-8 md:p-10">
                <div className="max-w-5xl">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="badge bg-white/15 text-white border border-white/20">
              {normalizeMissionType(mission.type)}
            </span>

                        <span className={status.className}>
              <span className="inline-flex items-center gap-1">
                {status.icon}
                  {status.label}
              </span>
            </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                        {mission.title}
                    </h2>

                    <div className="flex flex-wrap gap-6 text-white/85 text-sm">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{mission.client_name}</span>
                        </div>

                        {mission.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{mission.location}</span>
                            </div>
                        )}

                        {mission.start_date && (
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                <span>
                  {formatDate(mission.start_date)}
                                    {mission.end_date ? ` → ${formatDate(mission.end_date)}` : ''}
                </span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="bg-white border-b border-neutral-200 py-6 sticky top-20 z-40 print-reset">
                <div className="px-4 sm:px-6">
                    <div className="flex flex-wrap gap-6 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                            <BadgeEuro className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">TJM :</span>{' '}
                                {formatCurrency(mission.daily_rate || 0)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">CA prévu :</span>{' '}
                                {formatCurrency(mission.total_revenue || 0)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Encaissements :</span>{' '}
                                {formatCurrency(totalRevenueReceived)}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10 bg-neutral-50">
                <div className="px-4 sm:px-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Type</p>
                            <p className="font-semibold text-neutral-900">
                                {normalizeMissionType(mission.type)}
                            </p>
                        </div>

                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Statut</p>
                            <p className="font-semibold text-neutral-900">{status.label}</p>
                        </div>

                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Durée estimée</p>
                            <p className="font-semibold text-neutral-900">
                                {estimatedDuration !== null ? `${estimatedDuration} jour(s)` : '-'}
                            </p>
                        </div>

                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Revenus saisis</p>
                            <p className="font-semibold text-neutral-900">{revenues.length}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <div className="card p-6 print-reset print-break-avoid">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Client
                                </h3>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Nom</p>
                                        <p className="font-medium text-neutral-900">{mission.client_name}</p>
                                    </div>

                                    {mission.client_email && (
                                        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                            <p className="text-xs text-neutral-500 flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                Email
                                            </p>
                                            <p className="font-medium text-neutral-900 break-all">
                                                {mission.client_email}
                                            </p>
                                        </div>
                                    )}

                                    {mission.client_phone && (
                                        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                            <p className="text-xs text-neutral-500 flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                Téléphone
                                            </p>
                                            <p className="font-medium text-neutral-900">{mission.client_phone}</p>
                                        </div>
                                    )}

                                    {mission.location && (
                                        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                            <p className="text-xs text-neutral-500 flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                Lieu
                                            </p>
                                            <p className="font-medium text-neutral-900">{mission.location}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card p-6 print-reset print-break-avoid">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Financier
                                </h3>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Tarif journalier</p>
                                        <p className="font-semibold text-neutral-900">
                                            {formatCurrency(mission.daily_rate || 0)}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Chiffre d’affaires prévu</p>
                                        <p className="font-semibold text-neutral-900">
                                            {formatCurrency(mission.total_revenue || 0)}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Total encaissé</p>
                                        <p className="font-semibold text-neutral-900">
                                            {formatCurrency(totalRevenueReceived)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <div className="card p-8 print-reset print-break-avoid">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Planning
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Date de début</p>
                                        <p className="font-medium text-neutral-900">
                                            {formatDate(mission.start_date)}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Date de fin</p>
                                        <p className="font-medium text-neutral-900">
                                            {formatDate(mission.end_date)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-8 print-reset">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Revenus liés
                                </h3>

                                {revenues.length === 0 ? (
                                    <p className="text-neutral-500">Aucun revenu enregistré pour cette mission.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {revenues.map((revenue) => (
                                            <div
                                                key={revenue.id}
                                                className="rounded-xl border border-neutral-200 bg-white p-5"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-semibold text-neutral-900">
                                                            {revenue.source || 'Revenu'}
                                                        </h4>

                                                        {revenue.description && (
                                                            <p className="text-neutral-600 mt-2 leading-7">
                                                                {revenue.description}
                                                            </p>
                                                        )}

                                                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-neutral-500">
                                                            <span>Reçu le {formatDate(revenue.date_received)}</span>

                                                            {revenue.payment_method && (
                                                                <span>Paiement : {revenue.payment_method}</span>
                                                            )}

                                                            {revenue.invoice_number && (
                                                                <span>Facture : {revenue.invoice_number}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-[160px]">
                                                        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-right">
                                                            <p className="text-xs text-neutral-500">Montant</p>
                                                            <p className="font-semibold text-neutral-900">
                                                                {formatCurrency(revenue.amount)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {mission.notes && (
                                <div className="card p-8 print-reset print-break-avoid">
                                    <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                        Notes
                                    </h3>
                                    <p className="text-neutral-700 leading-7 whitespace-pre-line">
                                        {mission.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}