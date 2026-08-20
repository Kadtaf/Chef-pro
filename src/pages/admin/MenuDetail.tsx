import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, Tables } from '../../lib/supabase';
import {
    ArrowLeft,
    Printer,
    Edit,
    Leaf,
    Flame,
    BadgeEuro,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

type MenuRow = Tables<'menus'>;
type MenuItemRow = Tables<'menu_items'>;
type RecipeRow = Tables<'recipes'>;
type TechnicalSheetRow = Tables<'technical_sheets'>;

type HydratedMenuItem = MenuItemRow & {
    recipe?: RecipeRow | null;
    technical_sheet?: TechnicalSheetRow | null;
};

function normalizeItemType(type?: string | null) {
    switch (type) {
        case 'entree':
            return 'Entrée';
        case 'plat':
            return 'Plat';
        case 'dessert':
            return 'Dessert';
        case 'accompagnement':
            return 'Accompagnement';
        case 'boisson':
            return 'Boisson';
        default:
            return 'Élément';
    }
}

export default function MenuDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [menu, setMenu] = useState<MenuRow | null>(null);
    const [items, setItems] = useState<HydratedMenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMenu = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            setLoading(true);

            const { data: menuData, error: menuError } = await supabase
                .from('menus')
                .select('*')
                .eq('id', id)
                .single();

            if (menuError) {
                console.error('Erreur chargement menu admin:', menuError);
                setLoading(false);
                return;
            }

            if (!menuData) {
                setLoading(false);
                return;
            }

            setMenu(menuData);

            const { data: menuItemsData, error: menuItemsError } = await supabase
                .from('menu_items')
                .select('*')
                .eq('menu_id', menuData.id)
                .order('position', { ascending: true });

            if (menuItemsError) {
                console.error('Erreur chargement items menu:', menuItemsError);
                setLoading(false);
                return;
            }

            const menuItems = menuItemsData ?? [];

            const recipeIds = Array.from(
                new Set(menuItems.map((item) => item.recipe_id).filter(Boolean))
            ) as string[];

            const technicalSheetIds = Array.from(
                new Set(menuItems.map((item) => item.technical_sheet_id).filter(Boolean))
            ) as string[];

            let recipesMap = new Map<string, RecipeRow>();
            let technicalSheetsMap = new Map<string, TechnicalSheetRow>();

            if (recipeIds.length > 0) {
                const { data: recipesData, error: recipesError } = await supabase
                    .from('recipes')
                    .select('*')
                    .in('id', recipeIds);

                if (recipesError) {
                    console.error('Erreur chargement recettes du menu:', recipesError);
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
                    console.error('Erreur chargement fiches techniques du menu:', technicalSheetsError);
                } else {
                    technicalSheetsMap = new Map(
                        (technicalSheetsData ?? []).map((sheet) => [sheet.id, sheet])
                    );
                }
            }

            const hydratedItems: HydratedMenuItem[] = menuItems.map((item) => ({
                ...item,
                recipe: item.recipe_id ? recipesMap.get(item.recipe_id) ?? null : null,
                technical_sheet: item.technical_sheet_id
                    ? technicalSheetsMap.get(item.technical_sheet_id) ?? null
                    : null,
            }));

            setItems(hydratedItems);
            setLoading(false);
        };

        fetchMenu();
    }, [id]);

    const groupedItems = useMemo(() => {
        return items.reduce<Record<string, HydratedMenuItem[]>>((acc, item) => {
            const key = item.item_type || 'autre';
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
    }, [items]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!menu) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/menus')} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Menu introuvable
                        </h1>
                        <p className="text-neutral-500">
                            Ce menu n’existe pas ou n’est plus accessible.
                        </p>
                    </div>
                </div>

                <Link to="/admin/menus" className="btn-primary">
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
                    <button onClick={() => navigate('/admin/menus')} className="btn-ghost">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-neutral-900">
                            Détail du menu
                        </h1>
                        <p className="text-neutral-500">Consultation et impression</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={() => window.print()} className="btn-outline gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimer
                    </button>

                    <Link to={`/admin/menus/${menu.id}/edit`} className="btn-primary gap-2">
                        <Edit className="w-4 h-4" />
                        Modifier
                    </Link>
                </div>
            </div>

            <section className="relative h-[40vh] min-h-[320px] rounded-2xl overflow-hidden print-reset">
                <img
                    src={
                        menu.image_url ||
                        'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=1200'
                    }
                    alt={menu.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-5xl">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            {menu.category && (
                                <span className="badge bg-white/20 backdrop-blur text-white capitalize">
                  {menu.category}
                </span>
                            )}

                            {menu.season && menu.season !== 'all' && (
                                <span className="badge bg-white/20 backdrop-blur text-white capitalize">
                  {menu.season}
                </span>
                            )}

                            {menu.is_published ? (
                                <span className="badge badge-success">Publié</span>
                            ) : (
                                <span className="badge bg-white/20 backdrop-blur text-white">
                  Brouillon
                </span>
                            )}

                            {menu.is_balanced ? (
                                <span className="badge bg-success-500/80 text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Équilibré
                </span>
                            ) : (
                                <span className="badge bg-warning-500/80 text-white flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  Non équilibré
                </span>
                            )}

                            {menu.avg_nutri_score && (
                                <span className="badge bg-white/20 backdrop-blur text-white">
                  Nutri moyen {menu.avg_nutri_score}
                </span>
                            )}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
                            {menu.title}
                        </h2>

                        {menu.description && (
                            <p className="text-lg text-white/80 max-w-2xl">{menu.description}</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="bg-white border-b border-neutral-200 py-6 sticky top-20 z-40 print-reset">
                <div className="px-4 sm:px-6">
                    <div className="flex flex-wrap gap-6 text-sm text-neutral-600">
                        <div className="flex items-center gap-2">
                            <Leaf className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Saison :</span>{' '}
                                <span className="capitalize">{menu.season || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Calories :</span>{' '}
                                {menu.total_calories || 0} kcal
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <BadgeEuro className="w-5 h-5 text-primary-600" />
                            <div>
                                <span className="text-neutral-400">Prix :</span>{' '}
                                {formatCurrency(menu.price || 0)}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-10 bg-neutral-50">
                <div className="px-4 sm:px-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Catégorie</p>
                            <p className="font-semibold text-neutral-900 capitalize">
                                {menu.category || '-'}
                            </p>
                        </div>

                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Prix</p>
                            <p className="font-semibold text-neutral-900">
                                {formatCurrency(menu.price || 0)}
                            </p>
                        </div>

                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Total calories</p>
                            <p className="font-semibold text-neutral-900">
                                {menu.total_calories || 0} kcal
                            </p>
                        </div>

                        <div className="card p-5 print-reset">
                            <p className="text-xs text-neutral-500">Nutri-score moyen</p>
                            <p className="font-semibold text-neutral-900">
                                {menu.avg_nutri_score || '-'}
                            </p>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <div className="card p-8 print-reset">
                            <p className="text-neutral-500">Aucun élément enregistré dans ce menu.</p>
                        </div>
                    ) : (
                        Object.entries(groupedItems).map(([type, group]) => (
                            <div key={type} className="card p-8 print-reset print-break-avoid">
                                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-6">
                                    {normalizeItemType(type)}
                                </h3>

                                <div className="space-y-4">
                                    {group.map((item) => {
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

                                        const displayCalories =
                                            linkedRecipe?.calories_per_serving ||
                                            linkedSheet?.calories_per_portion ||
                                            0;

                                        const displayPrice =
                                            linkedRecipe?.cost_per_serving ||
                                            linkedSheet?.cost_per_portion ||
                                            0;

                                        const displayNutri =
                                            linkedRecipe?.nutri_score ||
                                            linkedSheet?.nutri_score ||
                                            null;

                                        return (
                                            <div
                                                key={item.id}
                                                className="rounded-xl border border-neutral-200 bg-white p-5"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-semibold text-neutral-900">
                                                            {displayTitle}
                                                        </h4>

                                                        {displayDescription && (
                                                            <p className="text-neutral-600 mt-2 leading-7">
                                                                {displayDescription}
                                                            </p>
                                                        )}

                                                        <div className="flex flex-wrap gap-2 mt-4">
                                                            {linkedRecipe && (
                                                                <span className="badge bg-primary-50 text-primary-700 border border-primary-200">
                                  Recette liée
                                </span>
                                                            )}

                                                            {linkedSheet && (
                                                                <span className="badge bg-secondary-50 text-secondary-700 border border-secondary-200">
                                  Fiche technique liée
                                </span>
                                                            )}

                                                            {displayNutri && (
                                                                <span className="badge bg-neutral-100 text-neutral-700">
                                  Nutri {displayNutri}
                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-1 gap-3 min-w-[180px]">
                                                        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                                                            <p className="text-xs text-neutral-500">Calories</p>
                                                            <p className="font-medium text-neutral-900">
                                                                {displayCalories} kcal
                                                            </p>
                                                        </div>

                                                        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                                                            <p className="text-xs text-neutral-500">Coût</p>
                                                            <p className="font-medium text-neutral-900">
                                                                {formatCurrency(displayPrice)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}