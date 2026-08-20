import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    ClipboardList,
    Thermometer,
    FileCheck,
    Clock,
    Check,
} from 'lucide-react';

type HACCPRecordRow = Tables<'haccp_records'>;

type ChecklistItem = {
    item: string;
    completed: boolean;
};

const HACCP_TYPES = [
    { value: 'cleaning', label: 'Nettoyage', icon: ClipboardList },
    { value: 'temperature', label: 'Température', icon: Thermometer },
    { value: 'delivery', label: 'Réception', icon: FileCheck },
    { value: 'traceability', label: 'Traçabilité', icon: Clock },
    { value: 'checklist', label: 'Checklist', icon: Check },
];

function parseChecklistItems(value: unknown): ChecklistItem[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const item = 'item' in entry ? String(entry.item ?? '') : '';
            const completed = 'completed' in entry ? Boolean(entry.completed) : false;
            return { item, completed };
        })
        .filter(Boolean) as ChecklistItem[];
}

export default function HACCPEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [record, setRecord] = useState<HACCPRecordRow | null>(null);

    const [formData, setFormData] = useState({
        type: 'cleaning',
        title: '',
        description: '',
        zone: '',
        responsible_person: '',
        temperature: null as number | null,
        notes: '',
        status: 'pending',
        checklist_items: [] as ChecklistItem[],
    });

    useEffect(() => {
        const fetchRecord = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('haccp_records')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Erreur chargement HACCP pour édition:', error);
                setLoading(false);
                return;
            }

            if (data) {
                setRecord(data);
                setFormData({
                    type: data.type || 'cleaning',
                    title: data.title || '',
                    description: data.description || '',
                    zone: data.zone || '',
                    responsible_person: data.responsible_person || '',
                    temperature:
                        data.temperature !== null && data.temperature !== undefined
                            ? Number(data.temperature)
                            : null,
                    notes: data.notes || '',
                    status: data.status || 'pending',
                    checklist_items: parseChecklistItems(data.checklist_items),
                });
            }

            setLoading(false);
        };

        fetchRecord();
    }, [id]);

    const selectedType = useMemo(
        () => HACCP_TYPES.find((type) => type.value === formData.type),
        [formData.type]
    );

    const handleChecklistChange = (
        index: number,
        key: keyof ChecklistItem,
        value: string | boolean
    ) => {
        setFormData((prev) => ({
            ...prev,
            checklist_items: prev.checklist_items.map((item, i) =>
                i === index ? { ...item, [key]: value } : item
            ),
        }));
    };

    const addChecklistItem = () => {
        setFormData((prev) => ({
            ...prev,
            checklist_items: [...prev.checklist_items, { item: '', completed: false }],
        }));
    };

    const removeChecklistItem = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            checklist_items: prev.checklist_items.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setSaving(true);

        const payload = {
            type: formData.type,
            title: formData.title,
            description: formData.description || null,
            zone: formData.zone || null,
            responsible_person: formData.responsible_person || null,
            temperature: formData.type === 'temperature' ? formData.temperature : null,
            notes: formData.notes || null,
            status: formData.status,
            checklist_items:
                formData.type === 'checklist'
                    ? formData.checklist_items.filter((item) => item.item.trim() !== '')
                    : [],
            completed_at:
                formData.status === 'completed' || formData.status === 'failed'
                    ? record?.completed_at || new Date().toISOString()
                    : null,
        };

        const { error } = await supabase
            .from('haccp_records')
            .update(payload)
            .eq('id', id);

        setSaving(false);

        if (error) {
            console.error('Erreur mise à jour HACCP:', error);
            return;
        }

        navigate(`/admin/haccp/${id}`);
    };

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
                            Impossible de modifier cet enregistrement HACCP.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const SelectedIcon = selectedType?.icon || ClipboardList;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/admin/haccp/${id}`)} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Modifier l’enregistrement HACCP
                        </h1>
                        <p className="text-neutral-500">{record.title}</p>
                    </div>
                </div>

                <button
                    type="submit"
                    form="haccp-edit-form"
                    disabled={saving}
                    className="btn-primary gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>

            <div className="card p-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
                        <SelectedIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-neutral-500">Type sélectionné</p>
                        <p className="font-semibold text-neutral-900">{selectedType?.label}</p>
                    </div>
                </div>
            </div>

            <form id="haccp-edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    <div className="card p-8 space-y-6">
                        <h2 className="text-xl font-display font-semibold text-neutral-900">
                            Informations générales
                        </h2>

                        <div>
                            <label className="label">Type *</label>
                            <select
                                required
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        type: e.target.value,
                                        temperature: e.target.value === 'temperature' ? prev.temperature : null,
                                        checklist_items: e.target.value === 'checklist' ? prev.checklist_items : [],
                                    }))
                                }
                                className="input"
                            >
                                {HACCP_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
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
                                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="label">Description</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                                }
                                className="input resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Zone</label>
                                <input
                                    type="text"
                                    value={formData.zone}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, zone: e.target.value }))}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="label">Responsable</label>
                                <input
                                    type="text"
                                    value={formData.responsible_person}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            responsible_person: e.target.value,
                                        }))
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
                                        setFormData((prev) => ({
                                            ...prev,
                                            temperature: e.target.value === '' ? null : parseFloat(e.target.value),
                                        }))
                                    }
                                    className="input"
                                />
                            </div>
                        )}
                    </div>

                    {formData.type === 'checklist' && (
                        <div className="card p-8 space-y-6">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="text-xl font-display font-semibold text-neutral-900">
                                    Éléments de checklist
                                </h2>

                                <button
                                    type="button"
                                    onClick={addChecklistItem}
                                    className="btn-outline gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter
                                </button>
                            </div>

                            {formData.checklist_items.length === 0 ? (
                                <p className="text-neutral-500">Aucun élément de checklist.</p>
                            ) : (
                                <div className="space-y-4">
                                    {formData.checklist_items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="rounded-xl border border-neutral-200 p-4 bg-white space-y-3"
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="text"
                                                    value={item.item}
                                                    onChange={(e) =>
                                                        handleChecklistChange(index, 'item', e.target.value)
                                                    }
                                                    className="input flex-1"
                                                    placeholder="Élément de contrôle"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => removeChecklistItem(index)}
                                                    className="p-3 rounded-lg hover:bg-error-50"
                                                >
                                                    <Trash2 className="w-4 h-4 text-error-500" />
                                                </button>
                                            </div>

                                            <label className="flex items-center gap-3 text-sm text-neutral-700">
                                                <input
                                                    type="checkbox"
                                                    checked={item.completed}
                                                    onChange={(e) =>
                                                        handleChecklistChange(index, 'completed', e.target.checked)
                                                    }
                                                />
                                                Élément déjà complété
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="card p-8 space-y-6">
                        <h2 className="text-xl font-display font-semibold text-neutral-900">Notes</h2>
                        <textarea
                            rows={5}
                            value={formData.notes}
                            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                            className="input resize-none"
                        />
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="card p-6 space-y-4 sticky top-24">
                        <h2 className="text-lg font-semibold text-neutral-900">Statut</h2>

                        <div>
                            <label className="label">Statut *</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                                className="input"
                            >
                                <option value="pending">En attente</option>
                                <option value="completed">Complété</option>
                                <option value="failed">Échec</option>
                            </select>
                        </div>

                        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 text-sm text-neutral-600">
                            Le champ `completed_at` sera automatiquement renseigné si le statut passe à
                            “complété” ou “échec”.
                        </div>

                        <button type="submit" disabled={saving} className="btn-primary w-full gap-2">
                            <Save className="w-4 h-4" />
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}