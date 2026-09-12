/**
 * MON RITUEL — la partie pure.
 *
 * Séparée de l'action serveur pour une raison précise : c'est ici que s'est
 * glissé un `Number(null) === 0` qui transformait « descendre d'un cran » en
 * « aller à la position 0 », donc en « ordre inchangé » pour la première
 * étape. Un calcul aussi petit mérite un test, parce qu'il casse en silence.
 */

/**
 * Où doit atterrir une étape déplacée.
 *
 * `rawTo` est ce que le client a envoyé — une **intention**, jamais une
 * position : le résultat est toujours borné à la longueur réelle de la liste.
 * Un champ absent doit rester absent : c'est la différence entre « d'un cran »
 * et « au début ».
 */
export function resolveMoveTarget(
  order: number[],
  stepId: number,
  rawTo: string | null | undefined,
  direction: string | null | undefined,
): number {
  const from = order.indexOf(stepId);
  if (from < 0) return -1;

  const hasTarget = rawTo !== null && rawTo !== undefined && String(rawTo).trim() !== "";
  const parsed = hasTarget ? Number(rawTo) : NaN;
  const to = Number.isFinite(parsed) ? parsed : from + (direction === "up" ? -1 : 1);

  return Math.max(0, Math.min(Math.max(0, order.length - 1), Math.round(to)));
}
