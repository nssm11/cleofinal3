import { CardRowSkeleton, StatRowSkeleton } from "@/components/account/account-ui";

/**
 * The account's breath — the shape of the room settling in: the metric trio,
 * then the ledger rows. Never a spinner; the layout tells the customer where
 * they are while the data arrives.
 */
export default function CompteLoading() {
  return (
    <div className="space-y-10">
      <StatRowSkeleton n={4} />
      <div>
        <div className="skeleton mb-3 h-3 w-24 rounded-[2px]" />
        <div className="skeleton mb-8 h-8 w-64 max-w-full rounded-[2px]" />
        <CardRowSkeleton n={3} />
      </div>
    </div>
  );
}
