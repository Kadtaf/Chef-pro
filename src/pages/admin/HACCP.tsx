import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Check,
    AlertTriangle,
    Clock,
    Thermometer,
    ClipboardList,
    FileCheck,
    Eye,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

const HACCP_TYPES = [
    { value: 'cleaning', label: 'Nettoyage', icon: ClipboardList },
    { value: 'temperature', label: 'Température', icon: Thermometer },
    { value: 'delivery', label: 'Réception', icon: FileCheck },
    { value: 'traceability', label: 'Traçabilité', icon: Clock },
    { value: 'checklist', label: 'Checklist', icon: Check },
];

type ChecklistItem = {
    item: string;
    completed: boolean;
    category?: string;
    frequency?: string;
    critical?: boolean;
    corrective_action?: string;
};

function parseChecklistText(text: string): ChecklistItem[] {
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) return [];

    const lines = normalized
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    const items: ChecklistItem[] = [];
    let current: Partial<ChecklistItem> | null = null;

    const flushCurrent = () => {
        if (current?.item) {
            items.push({
                item: current.item,
                completed: false,
                category: current.category || undefined,
                frequency: current.frequency || undefined,
                critical: current.critical ?? false,
                corrective_action: current.corrective_action || undefined,
            });
        }
        current = null;
    };

    const isActionCorrectiveLine = (line: string) =>
        /^action corrective$/i.test(line);

    const isCriticalLine = (line: string) =>
        /^critique$/i.test(line) || /^standard$/i.test(line);

    const looksLikeMetaLine = (line: string) =>
        line.includes('•') ||
        /quotidien|hebdomadaire|mensuel|par service|par poste|par jour/i.test(line);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (isActionCorrectiveLine(line)) {
            const nextLine = lines[i + 1];
            if (current && nextLine) {
                current.corrective_action = nextLine;
                i++;
            }
            continue;
        }

        if (isCriticalLine(line)) {
            if (current) {
                current.critical = /^critique$/i.test(line);
            }
            continue;
        }

        if (looksLikeMetaLine(line) && current && !current.category && !current.frequency) {
            const parts = line.split('•').map((part) => part.trim()).filter(Boolean);
            current.category = parts[0] || undefined;
            current.frequency = parts[1] || undefined;
            continue;
        }

        if (current?.item) {
            flushCurrent();
        }

        current = {
            item: line,
            completed: false,
        };
    }

    flushCurrent();

    if (items.length > 0) return items;

    return normalized
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((item) => ({
            item,
            completed: false,
        }));
}

function serializeChecklistItems(items: ChecklistItem[]): string {
    return items
        .map((item) => {
            const parts = [item.item];

            if (item.category || item.frequency) {
                parts.push(
                    `${item.category || 'Général'} • ${item.frequency || 'quotidien'}`
                );
            }

            parts.push(item.critical ? 'Critique' : 'Standard');

            if (item.corrective_action) {
                parts.push('Action corrective');
                parts.push(item.corrective_action);
            }

            return parts.join('\n');
        })
        .join('\n\n');
}

export default function HACCP() {
    const [records, setRecords] = useState<Tables<'haccp_records'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editRecord, setEditRecord] = useState<Tables<'haccp_records'> | null>(null);
    const [checklistText, setChecklistText] = useState('');
    const [formData, setFormData] = useState({
        type: 'cleaning',
        title: '',
        description: '',
        zone: '',
        responsible_person: '',
        temperature: null as number | null,
        notes: '',
        checklist_items: [] as ChecklistItem[],
    });

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        const { data } = await supabase
            .from('haccp_records')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setRecords(data);
        setLoading(false);
    };

    const resetForm = () => {
        setEditRecord(null);
        setChecklistText('');
        setFormData({
            type: 'cleaning',
            title: '',
            description: '',
            zone: '',
            responsible_person: '',
            temperature: null,
            notes: '',
            checklist_items: [],
        });
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (record: Tables<'haccp_records'>) => {
        const existingItems = Array.isArray(record.checklist_items)
            ? (record.checklist_items as ChecklistItem[])
            : [];

        setEditRecord(record);
        setFormData({
            type: record.type || 'cleaning',
            title: record.title || '',
            description: record.description || '',
            zone: record.zone || '',
            responsible_person: record.responsible_person || '',
            temperature:
                record.temperature !== null && record.temperature !== undefined
                    ? Number(record.temperature)
                    : null,
            notes: record.notes || '',
            checklist_items: existingItems,
        });
        setChecklistText(serializeChecklistItems(existingItems));
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedChecklistItems =
            formData.type === 'checklist' ? parseChecklistText(checklistText) : [];

        const data = {
            ...formData,
            status: editRecord?.status || 'pending',
            checklist_items: parsedChecklistItems,
            temperature: formData.type === 'temperature' ? formData.temperature : null,
        };

        if (editRecord) {
            await supabase.from('haccp_records').update(data).eq('id', editRecord.id);
        } else {
            await supabase.from('haccp_records').insert(data);
        }

        setShowModal(false);
        resetForm();
        fetchRecords();
    };

    const updateStatus = async (id: string, status: 'completed' | 'failed') => {
        await supabase
            .from('haccp_records')
            .update({ status, completed_at: new Date().toISOString() })
            .eq('id', id);

        fetchRecords();
    };

    const deleteRecord = async (id: string) => {
        if (confirm('Supprimer cet enregistrement ?')) {
            await supabase.from('haccp_records').delete().eq('id', id);
            fetchRecords();
        }
    };

    const filteredRecords = records.filter((r) => {
        const matchSearch =
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            (r.zone || '').toLowerCase().includes(search.toLowerCase());

        const matchType = typeFilter === 'all' || r.type === typeFilter;
        return matchSearch && matchType;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="badge badge-success">Complété</span>;
            case 'failed':
                return <span className="badge badge-error">Échec</span>;
            default:
                return <span className="badge badge-warning">En attente</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-neutral-900">
                        HACCP & Qualité
                    </h1>
                    <p className="text-neutral-500">{records.length} enregistrements</p>
                </div>

                <button onClick={openCreateModal} className="btn-primary gap-2">
                    <Plus className="w-5 h-5" />
                    Nouveau
                </button>
            </div>

            <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input pl-10"
                        />
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="input w-full md:w-auto"
                    >
                        <option value="all">Tous types</option>
                        {HACCP_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {HACCP_TYPES.map((t) => {
                    const count = records.filter(
                        (r) => r.type === t.value && r.status === 'pending'
                    ).length;

                    return (
                        <button
                            key={t.value}
                            onClick={() => setTypeFilter(t.value)}
                            className={`card p-4 text-center transition-all ${
                                typeFilter === t.value ? 'ring-2 ring-primary-500' : ''
                            }`}
                        >
                            <t.icon className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="text-sm font-medium">{t.label}</p>
                            {count > 0 && (
                                <span className="badge badge-warning mt-2">{count} en attente</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                    <tr>
                        <th>Type</th>
                        <th>Titre</th>
                        <th>Zone</th>
                        <th>Température</th>
                        <th>Statut</th>
                        <th>Date</th>
                        <th className="text-right">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-neutral-500">
                                Chargement...
                            </td>
                        </tr>
                    ) : filteredRecords.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-neutral-500">
                                Aucun enregistrement
                            </td>
                        </tr>
                    ) : (
                        filteredRecords.map((record) => (
                            <tr key={record.id}>
                                <td>
                                    <span className="badge badge-primary capitalize">{record.type}</span>
                                </td>
                                <td className="font-medium text-neutral-900">{record.title}</td>
                                <td className="text-neutral-600">{record.zone || '-'}</td>
                                <td className="text-neutral-600">
                                    {record.temperature !== null && record.temperature !== undefined
                                        ? `${record.temperature}°C`
                                        : '-'}
                                </td>
                                <td>{getStatusBadge(record.status)}</td>
                                <td className="text-neutral-500 text-sm">
                                    {formatDate(record.created_at)}
                                </td>
                                <td>
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            to={`/admin/haccp/${record.id}`}
                                            className="p-2 rounded-lg hover:bg-neutral-100"
                                            title="Voir"
                                        >
                                            <Eye className="w-4 h-4 text-neutral-500" />
                                        </Link>

                                        <button
                                            onClick={() => openEditModal(record)}
                                            className="p-2 rounded-lg hover:bg-primary-50"
                                            title="Modifier"
                                        >
                                            <Edit className="w-4 h-4 text-primary-600" />
                                        </button>

                                        {record.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(record.id, 'completed')}
                                                    className="p-2 rounded-lg hover:bg-success-50"
                                                    title="Marquer comme complété"
                                                >
                                                    <Check className="w-4 h-4 text-success-500" />
                                                </button>

                                                <button
                                                    onClick={() => updateStatus(record.id, 'failed')}
                                                    className="p-2 rounded-lg hover:bg-error-50"
                                                    title="Marquer en échec"
                                                >
                                                    <AlertTriangle className="w-4 h-4 text-error-500" />
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => deleteRecord(record.id)}
                                            className="p-2 rounded-lg hover:bg-error-50"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4 text-error-500" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-neutral-100">
                            <h2 className="text-lg font-semibold">
                                {editRecord ? 'Modifier l’enregistrement HACCP' : 'Nouvel enregistrement HACCP'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="label">Type *</label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, type: e.target.value })
                                    }
                                    className="input"
                                >
                                    {HACCP_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Titre *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="label">Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="input resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Zone</label>
                                    <input
                                        type="text"
                                        value={formData.zone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, zone: e.target.value })
                                        }
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="label">Personne responsable</label>
                                    <input
                                        type="text"
                                        value={formData.responsible_person}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                responsible_person: e.target.value,
                                            })
                                        }
                                        className="input"
                                    />
                                </div>
                            </div>

                            {formData.type === 'temperature' && (
                                <div>
                                    <label className="label">Température (°C)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.temperature ?? ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                temperature:
                                                    e.target.value === '' ? null : parseFloat(e.target.value),
                                            })
                                        }
                                        className="input"
                                    />
                                </div>
                            )}

                            {formData.type === 'checklist' && (
                                <div>
                                    <label className="label">
                                        Checklist structurée (format IA accepté)
                                    </label>
                                    <textarea
                                        rows={14}
                                        value={checklistText}
                                        onChange={(e) => setChecklistText(e.target.value)}
                                        className="input resize-none"
                                        placeholder={`Port des équipements de protection individuelle (EPI)
Hygiène • par service
Critique
Action corrective
Rappel immédiat des règles d'hygiène et remplacement des EPI si souillés

Lavage des mains avant manipulation des aliments
Hygiène • par service
Critique
Action corrective
Lavage immédiat des mains avec savon bactéricide`}
                                    />
                                    <p className="text-xs text-neutral-500 mt-2">
                                        Format pris en charge : item, ligne catégorie/fréquence, ligne Critique ou Standard,
                                        puis “Action corrective” + son contenu.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="label">Notes</label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                    }
                                    className="input resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="btn-outline flex-1"
                                >
                                    Annuler
                                </button>

                                <button type="submit" className="btn-primary flex-1">
                                    {editRecord ? 'Enregistrer les modifications' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}