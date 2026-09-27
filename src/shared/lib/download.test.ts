import { toCsv } from './download';

describe('toCsv', () => {
  it('escapes separators and quotes, prefixes a UTF-8 BOM', async () => {
    const blob = toCsv([
      { Nom: 'Crème; brûlée', Note: 'Dit "parfait"', Prix: 9.5, Vide: null },
      { Nom: 'Tarte', Note: 'ok', Prix: 7, Vide: undefined },
    ]);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    // Blob.text() strips the BOM while decoding.
    expect((await blob.text()).split('\n')).toEqual([
      'Nom;Note;Prix;Vide',
      '"Crème; brûlée";"Dit ""parfait""";9.5;',
      'Tarte;ok;7;',
    ]);
  });
});
