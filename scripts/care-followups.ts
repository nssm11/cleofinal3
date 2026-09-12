/**
 * LE RÉVEIL — envoie les lettres de suivi venues à échéance.
 *
 * Cette application ne fait tourner aucune tâche de fond. Ce script est donc
 * le point d'entrée à brancher sur un ordonnanceur (cron, tâche planifiée,
 * minuteur de l'hébergeur) : une exécution par heure suffit largement, les
 * échéances se comptent en jours.
 *
 * Idempotent : une lettre partie est marquée, et une exécution double ne
 * renvoie rien. Usage : `npm run care:followups` — qui charge `.env` par
 * `--env-file`, comme les autres scripts du dépôt.
 */
async function main() {
  const { runDueCareFollowUps } = await import("../src/lib/mail");
  const sent = await runDueCareFollowUps();
  console.log(`${sent} lettre(s) de suivi envoyée(s).`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
