import { detectAllergens, withDetectedAllergens } from './allergens';

describe('detectAllergens', () => {
  it.each([
    ['Farine T55', ['Gluten']],
    ['Beurre doux', ['Lait']],
    ["Jaunes d'œufs", ['Oeufs']],
    ['Noix de Saint-Jacques', ['Mollusques']],
    ['Filet de bar', ['Poisson']],
    ['Crème fraîche épaisse', ['Lait']],
    ['Vin blanc sec', ['Sulfites']],
    ['Moutarde de Dijon', ['Moutarde']],
    ['Pâte feuilletée pur beurre', ['Gluten', 'Lait']],
    ['Huile de sésame', ['Sésame']],
    ['Céleri-rave', ['Céleri']],
  ])('%s → %j', (name, expected) => {
    expect(detectAllergens(name).sort()).toEqual([...expected].sort());
  });

  it('avoids classic false positives', () => {
    expect(detectAllergens('Noix de coco râpée')).toEqual([]);
    expect(detectAllergens('Lait de coco')).toEqual([]);
    expect(detectAllergens('Beurre de cacao')).toEqual([]);
    expect(detectAllergens('Barbe à papa')).toEqual([]);
    expect(detectAllergens('Coquillettes')).toEqual(['Gluten']);
    expect(detectAllergens('Noix de veau')).toEqual([]);
    expect(detectAllergens('Carottes')).toEqual([]);
  });

  it('never removes declared allergens', () => {
    expect(withDetectedAllergens({ name: 'Sel', allergens: ['Céleri'] })).toEqual(['Céleri']);
    expect(withDetectedAllergens({ name: 'Beurre', allergens: ['Lait'] })).toEqual(['Lait']);
  });
});
