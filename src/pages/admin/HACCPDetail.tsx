import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import {
    ArrowLeft,
    Printer,
    Edit,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ClipboardList,
    Thermometer,
    FileCheck,
    Clock,
    Check,
    User,
    MapPin,
    StickyNote,
    CalendarDays,
    ShieldAlert,
    Wrench,
    Tags,
    Repeat,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

type HACCPRecordRow = Tables<'haccp_records'>;

type ChecklistItem = {
    item: string;
    completed: boolean;
    category?: string;
    frequency?: string;
    critical?: boolean;
    corrective_action?: string;
};

const HACCP_TYPES = [
    { value: 'cleaning', label: 'Nettoyage', icon: ClipboardList },
    { value: 'temperature', label: 'Température', icon: Thermometer },
    { value: 'delivery', label: 'Réception', icon: FileCheck },
    { value: 'traceability', label: 'Traçabilité', icon: Clock },
    { value: 'checklist', label: 'Checklist', icon: Check },
];

function getTypeMeta(type?: string | null) {
    return (
        HACCP_TYPES.find((t) => t.value === type) || {
            value: 'checklist',
            label: 'HACCP',
            icon: ClipboardList,
        }
    );
}

function getStatusMeta(status?: string | null) {
    switch (status) {
        case 'completed':
            return {
                label: 'Complété',
                className: 'badge bg-success-50 text-success-700 border border-success-200',
                icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            };
        case 'failed':
            return {
                label: 'Échec',
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

function parseChecklistItems(value: unknown): ChecklistItem[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;

            const item =
                'item' in entry
                    ? String(entry.item ?? '')
                    : 'check' in entry
                        ? String(entry.check ?? '')
                        : '';

            const completed = 'completed' in entry ? Boolean(entry.completed) : false;
            const category = 'category' in entry ? String(entry.category ?? '') : '';
            const frequency = 'frequency' in entry ? String(entry.frequency ?? '') : '';
            const corrective_action =
                'corrective_action' in entry ? String(entry.corrective_action ?? '') : '';
            const critical = 'critical' in entry ? Boolean(entry.critical) : false;

            if (!item) return null;

            return {
                item,
                completed,
                category: category || undefined,
                frequency: frequency || undefined,
                critical,
                corrective_action: corrective_action || undefined,
            };
        })
        .filter(Boolean) as ChecklistItem[];
}

export default function HACCPDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [record, setRecord] = useState<HACCPRecordRow | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecord = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            setLoading(true);

            const { data, error } = await supabase
                .from('haccp_records')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Erreur chargement enregistrement HACCP:', error);
                setLoading(false);
                return;
            }

            setRecord(data);
            setLoading(false);
        };

        fetchRecord();
    }, [id]);

    const typeMeta = useMemo(() => getTypeMeta(record?.type), [record?.type]);
    const statusMeta = useMemo(() => getStatusMeta(record?.status), [record?.status]);
    const checklistItems = useMemo(
        () => parseChecklistItems(record?.checklist_items),
        [record?.checklist_items]
    );

    const checklistStats = useMemo(() => {
        const total = checklistItems.length;
        const completed = checklistItems.filter((item) => item.completed).length;
        const critical = checklistItems.filter((item) => item.critical).length;
        return { total, completed, critical };
    }, [checklistItems]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/haccp')} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Enregistrement introuvable
                        </h1>
                        <p className="text-neutral-500">
                            Cet enregistrement HACCP n’existe pas ou n’est plus accessible.
                        </p>
                    </div>
                </div>

                <Link to="/admin/haccp" className="btn-primary">
                    Retour à la liste
                </Link>
            </div>
        );
    }

    const TypeIcon = typeMeta.icon;

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
                    <button onClick={() => navigate('/admin/haccp')} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Détail HACCP
                        </h1>
                        <p className="text-neutral-500">Consultation et impression</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={() => window.print()} className="btn-outline gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimer
                    </button>

                    <Link to={`/admin/haccp/${record.id}/edit`} className="btn-primary gap-2">
                        <Edit className="w-4 h-4" />
                        Modifier
                    </Link>
                </div>
            </div>

            <section className="rounded-2xl overflow-hidden print-reset bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white p-8 md:p-10">
                <div className="max-w-5xl">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="badge bg-white/15 text-white border border-white/20 inline-flex items-center gap-2">
              <TypeIcon className="w-3.5 h-3.5" />
                {typeMeta.label}
            </span>

                        <span className={statusMeta.className}>
              <span className="inline-flex items-center gap-1">
                {statusMeta.icon}
                  {statusMeta.label}
              </span>
            </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                        {record.title}
                    </h2>

                    {record.description && (
                        <p className="text-lg text-white/85 max-w-2xl">{record.description}</p>
                    )}
                </div>
            </section>

            <section className="bg-white border-b border-neutral-200 py-6 sticky top-20 z-40 print-reset">
                <div className="px-4 sm:px-6">
                    <div className="flex flex-wrap gap-6 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Zone :</span> {record.zone || '-'}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Responsable :</span>{' '}
                                {record.responsible_person || '-'}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Créé le :</span>{' '}
                                {formatDate(record.created_at)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Thermometer className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Température :</span>{' '}
                                {record.temperature !== null && record.temperature !== undefined
                                    ? `${record.temperature}°C`
                                    : '-'}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10 bg-neutral-50">
                <div className="px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <div className="card p-6 print-reset print-break-avoid">
                            <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                Informations
                            </h3>

                            <div className="space-y-4">
                                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                    <p className="text-xs text-neutral-500">Type</p>
                                    <p className="font-medium text-neutral-900">{typeMeta.label}</p>
                                </div>

                                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                    <p className="text-xs text-neutral-500">Statut</p>
                                    <p className="font-medium text-neutral-900">{statusMeta.label}</p>
                                </div>

                                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                    <p className="text-xs text-neutral-500">Zone</p>
                                    <p className="font-medium text-neutral-900">{record.zone || '-'}</p>
                                </div>

                                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                    <p className="text-xs text-neutral-500">Responsable</p>
                                    <p className="font-medium text-neutral-900">
                                        {record.responsible_person || '-'}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                    <p className="text-xs text-neutral-500">Complété le</p>
                                    <p className="font-medium text-neutral-900">
                                        {record.completed_at ? formatDate(record.completed_at) : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {record.type === 'checklist' && (
                            <div className="card p-6 print-reset print-break-avoid">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Synthèse checklist
                                </h3>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Nombre de points</p>
                                        <p className="font-semibold text-neutral-900">{checklistStats.total}</p>
                                    </div>

                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Points complétés</p>
                                        <p className="font-semibold text-neutral-900">
                                            {checklistStats.completed}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Points critiques</p>
                                        <p className="font-semibold text-neutral-900">
                                            {checklistStats.critical}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        {record.description && (
                            <div className="card p-8 print-reset print-break-avoid">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Description
                                </h3>
                                <p className="text-neutral-700 leading-7 whitespace-pre-line">
                                    {record.description}
                                </p>
                            </div>
                        )}

                        {record.type === 'temperature' && (
                            <div className="card p-8 print-reset print-break-avoid">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Contrôle température
                                </h3>
                                <div className="rounded-xl border border-neutral-200 bg-white p-5">
                                    <p className="text-xs text-neutral-500">Température relevée</p>
                                    <p className="text-3xl font-display font-bold text-primary-600 mt-2">
                                        {record.temperature !== null && record.temperature !== undefined
                                            ? `${record.temperature}°C`
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {record.type === 'checklist' && (
                            <div className="card p-8 print-reset">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Checklist
                                </h3>

                                {checklistItems.length === 0 ? (
                                    <p className="text-neutral-500">Aucun élément de checklist.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {checklistItems.map((item, index) => (
                                            <div
                                                key={`${item.item}-${index}`}
                                                className="rounded-xl border border-neutral-200 bg-white p-5"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                                            <h4 className="text-lg font-semibold text-neutral-900">
                                                                {item.item}
                                                            </h4>

                                                            {item.completed ? (
                                                                <span className="badge badge-success">Fait</span>
                                                            ) : (
                                                                <span className="badge badge-warning">À faire</span>
                                                            )}

                                                            {item.critical ? (
                                                                <span className="badge bg-error-50 text-error-700 border border-error-200 inline-flex items-center gap-1">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  Critique
                                </span>
                                                            ) : (
                                                                <span className="badge bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  Standard
                                </span>
                                                            )}
                                                        </div>

                                                        {(item.category || item.frequency) && (
                                                            <div className="flex flex-wrap gap-3 mb-4 text-sm text-neutral-600">
                                                                {item.category && (
                                                                    <span className="inline-flex items-center gap-2">
                                    <Tags className="w-4 h-4 text-primary-600" />
                                                                        {item.category}
                                  </span>
                                                                )}

                                                                {item.frequency && (
                                                                    <span className="inline-flex items-center gap-2">
                                    <Repeat className="w-4 h-4 text-primary-600" />
                                                                        {item.frequency}
                                  </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {item.corrective_action && (
                                                            <div className="rounded-lg bg-warning-50 border border-warning-200 p-4">
                                                                <p className="text-sm font-medium text-warning-800 inline-flex items-center gap-2 mb-2">
                                                                    <Wrench className="w-4 h-4" />
                                                                    Action corrective
                                                                </p>
                                                                <p className="text-sm text-warning-900 leading-6">
                                                                    {item.corrective_action}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {record.notes && (
                            <div className="card p-8 print-reset print-break-avoid">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6 flex items-center gap-2">
                                    <StickyNote className="w-5 h-5 text-primary-600" />
                                    Notes
                                </h3>
                                <p className="text-neutral-700 leading-7 whitespace-pre-line">
                                    {record.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}