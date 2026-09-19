import type { Metadata } from "next";
import { SectionHead } from "@/components/admin/os/primitives";
import { CampaignBuilder } from "@/components/admin/campaign-builder";

export const metadata: Metadata = { title: "Campagnes" };
export default function CampaignsPage() { return <div className="space-y-5"><SectionHead eyebrow="Growth" title="Campaign builder" sub="New admin module for landing pages, buying guides, newsletter blocks, push notifications, influencer links and UTM planning." /><CampaignBuilder /></div>; }
