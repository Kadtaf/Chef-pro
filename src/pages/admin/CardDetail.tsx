import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import {
    ArrowLeft,
    Printer,
    Edit,
    BookOpen,
    BadgeEuro,
    CheckCircle2,
    XCircle,
    Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

type CardRow = Tables<'cards'>;
type CardSectionRow = Tables<'card_sections'>;
type CardSectionItemRow = Tables<'card_section_items'>;
type RecipeRow = Tables<'recipes'>;
type TechnicalSheetRow = Tables<'technical_sheets'>;

type HydratedCardSectionItem = CardSectionItemRow & {
    recipe?: RecipeRow | null;
    technical_sheet?: TechnicalSheetRow | null;
};

type HydratedCardSection = CardSectionRow & {
    items: HydratedCardSectionItem[];
};

function normalizeCategory(category?: string | null) {
    switch (category) {
        case 'restaurant':
            return 'Restaurant';
        case 'traiteur':
            return 'Traiteur';
        case 'evenement':
            return 'Événement';
        case 'saisonniere':
            return 'Saisonnière';
        default:
            return 'Carte';
    }
}

export default function CardDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [card, setCard] = useState<CardRow | null>(null);
    const [sections, setSections] = useState<HydratedCardSection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCard = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            setLoading(true);

            const { data: cardData, error: cardError } = await supabase
                .from('cards')
                .select('*')
                .eq('id', id)
                .single();

            if (cardError) {
                console.error('Erreur chargement carte admin:', cardError);
                setLoading(false);
                return;
            }

            if (!cardData) {
                setLoading(false);
                return;
            }

            setCard(cardData);

            const { data: sectionsData, error: sectionsError } = await supabase
                .from('card_sections')
                .select('*')
                .eq('card_id', cardData.id)
                .order('position', { ascending: true });

            if (sectionsError) {
                console.error('Erreur chargement sections carte:', sectionsError);
                setLoading(false);
                return;
            }

            const sectionRows = sectionsData ?? [];
            const sectionIds = sectionRows.map((section) => section.id);

            let itemsData: CardSectionItemRow[] = [];

            if (sectionIds.length > 0) {
                const { data, error } = await supabase
                    .from('card_section_items')
                    .select('*')
                    .in('card_section_id', sectionIds)
                    .order('position', { ascending: true });

                if (error) {
                    console.error('Erreur chargement items de carte:', error);
                    setLoading(false);
                    return;
                }

                itemsData = data ?? [];
            }

            const recipeIds = Array.from(
                new Set(itemsData.map((item) => item.recipe_id).filter(Boolean))
            ) as string[];

            const technicalSheetIds = Array.from(
                new Set(itemsData.map((item) => item.technical_sheet_id).filter(Boolean))
            ) as string[];

            let recipesMap = new Map<string, RecipeRow>();
            let technicalSheetsMap = new Map<string, TechnicalSheetRow>();

            if (recipeIds.length > 0) {
                const { data: recipesData, error: recipesError } = await supabase
                    .from('recipes')
                    .select('*')
                    .in('id', recipeIds);

                if (recipesError) {
                    console.error('Erreur chargement recettes liées:', recipesError);
                } else {
                    recipesMap = new Map((recipesData ?? []).map((recipe) => [recipe.id, recipe]));
                }
            }

            if (technicalSheetIds.length > 0) {
                const { data: technicalSheetsData, error: technicalSheetsError } = await supabase
                    .from('technical_sheets')
                    .select('*')
                    .in('id', technicalSheetIds);

                if (technicalSheetsError) {
                    console.error('Erreur chargement fiches techniques liées:', technicalSheetsError);
                } else {
                    technicalSheetsMap = new Map(
                        (technicalSheetsData ?? []).map((sheet) => [sheet.id, sheet])
                    );
                }
            }

            const hydratedSections: HydratedCardSection[] = sectionRows.map((section) => {
                const sectionItems = itemsData
                    .filter((item) => item.card_section_id === section.id)
                    .map((item) => ({
                        ...item,
                        recipe: item.recipe_id ? recipesMap.get(item.recipe_id) ?? null : null,
                        technical_sheet: item.technical_sheet_id
                            ? technicalSheetsMap.get(item.technical_sheet_id) ?? null
                            : null,
                    }));

                return {
                    ...section,
                    items: sectionItems,
                };
            });

            setSections(hydratedSections);
            setLoading(false);
        };

        fetchCard();
    }, [id]);

    const totalItems = useMemo(() => {
        return sections.reduce((sum, section) => sum + section.items.length, 0);
    }, [sections]);

    const suggestionCount = useMemo(() => {
        return sections.reduce(
            (sum, section) => sum + section.items.filter((item) => item.is_suggestion).length,
            0
        );
    }, [sections]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!card) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/cards')} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Carte introuvable
                        </h1>
                        <p className="text-neutral-500">
                            Cette carte n’existe pas ou n’est plus accessible.
                        </p>
                    </div>
                </div>

                <Link to="/admin/cards" className="btn-primary">
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
                    <button onClick={() => navigate('/admin/cards')} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Détail de la carte
                        </h1>
                        <p className="text-neutral-500">Consultation et impression</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={() => window.print()} className="btn-outline gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimer
                    </button>

                    <Link to={`/admin/cards/${card.id}/edit`} className="btn-primary gap-2">
                        <Edit className="w-4 h-4" />
                        Modifier
                    </Link>
                </div>
            </div>

            <section className="relative h-[40vh] min-h-[320px] rounded-2xl overflow-hidden print-reset">
                <img
                    src={
                        card.image_url ||
                        'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1200'
                    }
                    alt={card.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-5xl">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="badge bg-white/20 backdrop-blur text-white">
                {normalizeCategory(card.category)}
              </span>

                            {card.is_published ? (
                                <span className="badge badge-success">Publié</span>
                            ) : (
                                <span className="badge bg-white/20 backdrop-blur text-white">
                  Brouillon
                </span>
                            )}

                            {card.is_balanced ? (
                                <span className="badge bg-success-500/80 text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Équilibrée
                </span>
                            ) : (
                                <span className="badge bg-warning-500/80 text-white flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  Non équilibrée
                </span>
                            )}

                            {suggestionCount > 0 && (
                                <span className="badge bg-white/20 backdrop-blur text-white flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                                    {suggestionCount} suggestion{suggestionCount > 1 ? 's' : ''}
                </span>
                            )}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
                            {card.title}
                        </h2>

                        {card.description && (
                            <p className="text-lg text-white/80 max-w-2xl">{card.description}</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="bg-white border-b border-neutral-200 py-6 sticky top-20 z-40 print-reset">
                <div className="px-4 sm:px-6">
                    <div className="flex flex-wrap gap-6 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Sections :</span> {sections.length}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <BadgeEuro className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Éléments :</span> {totalItems}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Suggestions :</span> {suggestionCount}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10 bg-neutral-50">
                <div className="px-4 sm:px-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Type de carte</p>
                            <p className="font-semibold text-neutral-900">
                                {normalizeCategory(card.category)}
                            </p>
                        </div>

                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Nombre de sections</p>
                            <p className="font-semibold text-neutral-900">{sections.length}</p>
                        </div>

                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Nombre d’éléments</p>
                            <p className="font-semibold text-neutral-900">{totalItems}</p>
                        </div>
                    </div>

                    {sections.length === 0 ? (
                        <div className="card p-8 print-reset">
                            <p className="text-neutral-500">Aucune section enregistrée pour cette carte.</p>
                        </div>
                    ) : (
                        sections.map((section) => (
                            <div
                                key={section.id}
                                className="card p-8 print-reset print-break-avoid"
                            >
                                <div className="mb-6">
                                    <h3 className="text-xl font-display font-semibold text-neutral-900">
                                        {section.title}
                                    </h3>
                                    {section.description && (
                                        <p className="text-neutral-600 mt-2">{section.description}</p>
                                    )}
                                </div>

                                {section.items.length === 0 ? (
                                    <p className="text-neutral-500">Aucun élément dans cette section.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {section.items.map((item) => {
                                            const linkedRecipe = item.recipe;
                                            const linkedSheet = item.technical_sheet;

                                            const displayTitle =
                                                item.custom_title ||
                                                linkedRecipe?.title ||
                                                linkedSheet?.title ||
                                                'Élément sans titre';

                                            const displayDescription =
                                                item.custom_description ||
                                                linkedRecipe?.description ||
                                                linkedSheet?.description ||
                                                '';

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="rounded-xl border border-neutral-200 bg-white p-5"
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h4 className="text-lg font-semibold text-neutral-900">
                                                                    {displayTitle}
                                                                </h4>

                                                                {item.is_suggestion && (
                                                                    <span className="badge bg-primary-50 text-primary-700 border border-primary-200">
                                    Suggestion
                                  </span>
                                                                )}

                                                                {linkedRecipe && (
                                                                    <span className="badge bg-success-50 text-success-700 border border-success-200">
                                    Recette liée
                                  </span>
                                                                )}

                                                                {linkedSheet && (
                                                                    <span className="badge bg-secondary-50 text-secondary-700 border border-secondary-200">
                                    Fiche technique liée
                                  </span>
                                                                )}
                                                            </div>

                                                            {displayDescription && (
                                                                <p className="text-neutral-600 mt-2 leading-7">
                                                                    {displayDescription}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="min-w-[140px]">
                                                            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-right">
                                                                <p className="text-xs text-neutral-500">Prix</p>
                                                                <p className="font-semibold text-neutral-900">
                                                                    {formatCurrency(item.price || 0)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}