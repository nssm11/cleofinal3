import { addonImplementations } from "@/lib/addon-implementation";

export const dynamic = "force-dynamic";

function cell(value: string | number | boolean) {
  const raw = String(value);
  return /[",\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

export function GET() {
  const rows = [
    ["id", "batch", "area", "mode", "kind", "owner", "installed", "title", "href", "detail", "json"],
    ...addonImplementations.map((item) => [
      item.id,
      item.batch,
      item.area,
      item.mode,
      item.kind,
      item.owner,
      item.installed,
      item.title,
      item.href,
      `/addons/${item.id}`,
      item.jsonHref,
    ]),
  ];
  const csv = `${rows.map((row) => row.map(cell).join(",")).join("\n")}\n`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="cleopatre-240-addons.csv"',
    },
  });
}
