import { emptyIngredient } from '@/features/culinary/schema';
import { emptyRecipe, recipeFormSchema, toRecipePayload } from './schema';

describe('recipe form', () => {
  const values = {
    ...emptyRecipe(),
    title: 'Crème brûlée à la vanille',
    servings: 4,
    ingredients: [
      {
        ...emptyIngredient(),
        name: 'Crème',
        quantity: 500,
        unit: 'ml',
        cost: 3.2,
        calories: 1500,
        lipides: 150,
        acides_gras_satures: 95,
        allergens: ['Lait'],
      },
      {
        ...emptyIngredient(),
        name: 'Jaunes',
        quantity: 120,
        unit: 'g',
        cost: 1.2,
        calories: 380,
        proteines: 19,
        allergens: ['Oeufs'],
      },
      {
        ...emptyIngredient(),
        name: 'Sucre',
        quantity: 100,
        unit: 'g',
        cost: 0.2,
        calories: 400,
        glucides: 100,
        sucres: 100,
      },
    ],
    steps: [{ instruction: 'Infuser' }, { instruction: 'Cuire à 100 °C' }],
  };

  it('computes derived columns for the RPC', () => {
    const { recipe, ingredients, steps } = toRecipePayload(values);
    expect(recipe).toMatchObject({
      slug: 'creme-brulee-a-la-vanille',
      calories_per_serving: 570,
      cost_per_serving: 1.15,
      nutri_score: 'D', // 180 g/portion → 16 points
      image_url: null,
    });
    expect(recipe).not.toHaveProperty('id');
    expect(recipe).not.toHaveProperty('ingredients');
    expect(ingredients).toHaveLength(3);
    expect(steps).toHaveLength(2);
  });

  it('coerces empty number inputs and validates titles', () => {
    const result = recipeFormSchema.safeParse({ ...values, title: 'x', prep_time: Number.NaN, portion_weight_g: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join('.'))).toEqual(['title']);
  });
});
