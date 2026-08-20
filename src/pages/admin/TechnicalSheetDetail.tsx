import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import {
    ArrowLeft,
    Printer,
    Edit,
    Clock,
    Flame,
    Coins,
    TrendingUp,
    Package,
} from 'lucide-react';
import { formatDuration, formatCurrency, getNutriScoreClass } from '../../lib/utils';

export default function TechnicalSheetDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [sheet, setSheet] = useState<Tables<'technical_sheets'> | null>(null);
    const [ingredients, setIngredients] = useState<Tables<'technical_sheet_ingredients'>[]>([]);
    const [steps, setSteps] = useState<Tables<'technical_sheet_steps'>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTechnicalSheet = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            setLoading(true);

            const { data: sheetData, error: sheetError } = await supabase
                .from('technical_sheets')
                .select('*')
                .eq('id', id)
                .single();

            if (sheetError) {
                console.error('Erreur chargement fiche technique admin:', sheetError);
                setLoading(false);
                return;
            }

            if (sheetData) {
                setSheet(sheetData);

                const [ingredientsRes, stepsRes] = await Promise.all([
                    supabase
                        .from('technical_sheet_ingredients')
                        .select('*')
                        .eq('technical_sheet_id', sheetData.id)
                        .order('created_at', { ascending: true }),
                    supabase
                        .from('technical_sheet_steps')
                        .select('*')
                        .eq('technical_sheet_id', sheetData.id)
                        .order('step_number', { ascending: true }),
                ]);

                if (ingredientsRes.error) {
                    console.error('Erreur chargement ingrédients fiche technique:', ingredientsRes.error);
                }

                if (stepsRes.error) {
                    console.error('Erreur chargement étapes fiche technique:', stepsRes.error);
                }

                if (ingredientsRes.data) setIngredients(ingredientsRes.data);
                if (stepsRes.data) setSteps(stepsRes.data);
            }

            setLoading(false);
        };

        fetchTechnicalSheet();
    }, [id]);

    const computedAllergens = useMemo(() => {
        return Array.from(new Set(ingredients.flatMap((i) => i.allergens || [])));
    }, [ingredients]);

    const totalIngredientCost = useMemo(() => {
        return ingredients.reduce((sum, ing) => sum + Number(ing.cost || 0), 0);
    }, [ingredients]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!sheet) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/technical-sheets')} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Fiche technique introuvable
                        </h1>
                        <p className="text-neutral-500">
                            Cette fiche technique n’existe pas ou n’est plus accessible.
                        </p>
                    </div>
                </div>

                <Link to="/admin/technical-sheets" className="btn-primary">
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
          }
        `}
            </style>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 no-print">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/technical-sheets')} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Détail de la fiche technique
                        </h1>
                        <p className="text-neutral-500">Consultation et impression</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={() => window.print()} className="btn-outline gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimer
                    </button>

                    <Link
                        to={`/admin/technical-sheets/${sheet.id}/edit`}
                        className="btn-primary gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Modifier
                    </Link>
                </div>
            </div>

            <section className="relative h-[40vh] min-h-[320px] rounded-2xl overflow-hidden print-reset">
                <img
                    src={
                        sheet.image_url ||
                        'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200'
                    }
                    alt={sheet.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-5xl">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="badge bg-white/20 backdrop-blur text-white">
                {sheet.category}
              </span>

                            {sheet.nutri_score && (
                                <span className={`badge ${getNutriScoreClass(sheet.nutri_score)}`}>
                  Nutri-Score {sheet.nutri_score}
                </span>
                            )}

                            {sheet.is_published ? (
                                <span className="badge badge-success">Publié</span>
                            ) : (
                                <span className="badge bg-white/20 backdrop-blur text-white">
                  Brouillon
                </span>
                            )}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
                            {sheet.title}
                        </h2>

                        {sheet.description && (
                            <p className="text-lg text-white/80 max-w-2xl">{sheet.description}</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="bg-white border-b border-neutral-200 py-6 sticky top-20 z-40 print-reset">
                <div className="px-4 sm:px-6">
                    <div className="flex flex-wrap gap-6 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Préparation :</span>{' '}
                                {formatDuration(sheet.preparation_time)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Cuisson :</span>{' '}
                                {formatDuration(sheet.cooking_time)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary-600" />
                            <div>{sheet.portions} portions</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-primary-600" />
                            <div>{formatCurrency(sheet.cost_per_portion)}/portion</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-600" />
                            <div>Marge x{sheet.margin_ratio}</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10 bg-neutral-50">
                <div className="px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="card p-6 sticky top-36 print-reset">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Données clés
                                </h3>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Coût total</p>
                                        <p className="font-semibold text-neutral-900">
                                            {formatCurrency(sheet.total_cost)}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Prix de vente</p>
                                        <p className="font-semibold text-neutral-900">
                                            {formatCurrency(sheet.selling_price)}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Coût / portion</p>
                                        <p className="font-semibold text-neutral-900">
                                            {formatCurrency(sheet.cost_per_portion)}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Marge</p>
                                        <p className="font-semibold text-neutral-900">x{sheet.margin_ratio}</p>
                                    </div>

                                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4">
                                        <p className="text-xs text-neutral-500">Coût ingrédients calculé</p>
                                        <p className="font-semibold text-neutral-900">
                                            {formatCurrency(totalIngredientCost)}
                                        </p>
                                    </div>
                                </div>

                                {!!computedAllergens.length && (
                                    <div className="mt-6 pt-6 border-t border-neutral-100">
                                        <p className="text-sm font-medium text-neutral-700 mb-2">Allergènes :</p>
                                        <div className="flex flex-wrap gap-2">
                                            {computedAllergens.map((a) => (
                                                <span key={a} className="badge badge-warning">
                          {a}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <div className="card p-8 print-reset">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Ingrédients
                                </h3>

                                {ingredients.length > 0 ? (
                                    <div className="space-y-3">
                                        {ingredients.map((ing) => (
                                            <div
                                                key={ing.id}
                                                className="rounded-lg border border-neutral-200 bg-white p-4 flex items-start justify-between gap-4"
                                            >
                                                <div>
                                                    <p className="font-medium text-neutral-900">{ing.name}</p>
                                                    {!!ing.allergens?.length && (
                                                        <p className="text-xs text-warning-700 mt-1">
                                                            Allergènes : {ing.allergens.join(', ')}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="text-right text-sm text-neutral-600">
                                                    <p>
                                                        {ing.quantity} {ing.unit}
                                                    </p>
                                                    <p>{formatCurrency(ing.cost)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-neutral-500">Ingrédients non spécifiés</p>
                                )}
                            </div>

                            <div className="card p-8 print-reset">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-8">
                                    Étapes de préparation
                                </h3>

                                {steps.length > 0 ? (
                                    <ol className="space-y-8">
                                        {steps.map((step) => (
                                            <li key={step.id} className="flex gap-4">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                                                    {step.step_number}
                                                </div>
                                                <div className="flex-1 pt-2">
                                                    <p className="text-neutral-700 leading-relaxed">
                                                        {step.instruction}
                                                    </p>
                                                    {step.image_url && (
                                                        <img
                                                            src={step.image_url}
                                                            alt={`Étape ${step.step_number}`}
                                                            className="mt-4 rounded-lg max-h-64 object-cover"
                                                        />
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-neutral-500">Instructions non spécifiées</p>
                                )}
                            </div>

                            <div className="card p-8 print-reset">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    Valeurs nutritionnelles
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div className="text-center p-4 rounded-lg bg-neutral-50">
                                        <div className="text-2xl font-display font-bold text-primary-600">
                                            {sheet.calories_per_portion}
                                        </div>
                                        <div className="text-sm text-neutral-500">kcal/portion</div>
                                    </div>

                                    <div className="text-center p-4 rounded-lg bg-neutral-50">
                                        <div className="text-2xl font-display font-bold text-primary-600">
                                            {sheet.proteines}g
                                        </div>
                                        <div className="text-sm text-neutral-500">Protéines</div>
                                    </div>

                                    <div className="text-center p-4 rounded-lg bg-neutral-50">
                                        <div className="text-2xl font-display font-bold text-primary-600">
                                            {sheet.glucides}g
                                        </div>
                                        <div className="text-sm text-neutral-500">Glucides</div>
                                    </div>

                                    <div className="text-center p-4 rounded-lg bg-neutral-50">
                                        <div className="text-2xl font-display font-bold text-primary-600">
                                            {sheet.lipides}g
                                        </div>
                                        <div className="text-sm text-neutral-500">Lipides</div>
                                    </div>

                                    <div className="text-center p-4 rounded-lg bg-neutral-50">
                                        <div className="text-2xl font-display font-bold text-primary-600">
                                            {sheet.fibres}g
                                        </div>
                                        <div className="text-sm text-neutral-500">Fibres</div>
                                    </div>

                                    <div className="text-center p-4 rounded-lg bg-neutral-50">
                                        <div className="text-2xl font-display font-bold text-primary-600">
                                            {sheet.sel}g
                                        </div>
                                        <div className="text-sm text-neutral-500">Sel</div>
                                    </div>
                                </div>

                                <p className="text-xs text-neutral-400 mt-4">
                                    * Valeurs approximatives par portion
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}