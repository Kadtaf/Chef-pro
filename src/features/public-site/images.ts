/**
 * Stand-in photos shown until the chef uploads a portrait (admin → Paramètres →
 * Le Chef). Deliberately faceless: a stranger's face next to the chef's name
 * would pass for his portrait.
 */
const pexels = (id: number, width: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

/** A chef's hands adding herbs to a pan of vegetables, dark kitchen (portrait format, face out of frame). */
export const CHEF_PLACEHOLDER_ABOUT = pexels(4252140, 900);
/** A cook at work in a steaming professional kitchen. */
export const CHEF_PLACEHOLDER_HOME = pexels(3298637, 900);
