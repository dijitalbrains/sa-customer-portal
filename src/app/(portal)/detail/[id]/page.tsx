import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRenewalDetail } from "@/lib/actions/renewal-detail.actions";
import Breadcrumb from "@/components/ui/breadcrumb";
import type { PauseItem } from "@/components/shared/pause-subscription-dialog";
import RenewalCard from "../_components/renewal-card";
import RenewalHeader from "../_components/renewal-header";

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RenewalDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const subscriptionId = Number(id);
  if (!Number.isFinite(subscriptionId)) notFound();

  const [session, detail] = await Promise.all([auth(), getRenewalDetail(subscriptionId)]);
  if (!detail || detail.subscriptionItems.length === 0) notFound();

  const { subscriptionItems, availableLinkedProducts } = detail;
  const subscription = subscriptionItems[0].subscription;
  const isAdmin = (session?.adminId ?? 0) > 0;
  const breadcrumbTitle = subscription.nickname
    ? `${subscription.technology} – ${subscription.nickname}`
    : subscription.technology;

  const pauseItems: PauseItem[] = subscriptionItems.map((item) => ({
    id: item.id,
    productName: item.productName,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb page="renewal-detail" current={breadcrumbTitle} />

      <section className="bg-surface-overlay rounded-lg shadow-card-soft w-full p-4 flex flex-col gap-4">
        <RenewalHeader
          subscription={subscription}
          showAddP1Filter={isAdmin && subscription.canAddP1Filter}
          canRemoveSubscription={subscription.isShowerFilter || isAdmin}
        />

        <div className="flex flex-col gap-4">
          {subscriptionItems.map((item) => (
            <RenewalCard
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              availableLinkedProducts={availableLinkedProducts}
              pauseItems={pauseItems}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
