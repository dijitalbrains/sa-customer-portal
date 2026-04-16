import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRenewalDetail } from "@/lib/actions/renewal-detail.actions";
import Breadcrumb from "@/components/ui/breadcrumb";
import SettingRow from "@/components/ui/setting-row";
import RenewalDetailCard from "../_components/renewal-detail-card";
import AddP1Filter from "../_components/add-p1-filter";
import NicknameRow from "../_components/nickname-row";
import RemoveButton from "../_components/remove-button";
import { removeSubscription } from "../actions";

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RenewalDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const subscriptionId = Number(id);
  if (!Number.isFinite(subscriptionId)) notFound();

  const [session, detail] = await Promise.all([auth(), getRenewalDetail(subscriptionId)]);
  if (!detail) notFound();

  const isAdmin = (session?.adminId ?? 0) > 0;
  const canRemoveSubscription = detail.isShowerFilter || isAdmin;
  const setupLabel = `${detail.technology} | Zone ${detail.zone}`;
  const title = detail.nickname ? `${detail.technology} – ${detail.nickname}` : detail.technology;
  const summaryLine = `${detail.nickname || detail.technology} | ${detail.technology} | Zone ${detail.zone}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: "Filter Renewals", href: "/" },
            { label: title },
          ]}
        />

        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[26px] font-bold text-text-heading">Filter Renewal Details</h1>
          <span className="text-[13px] font-medium text-text-muted">{summaryLine}</span>
        </header>
      </div>

      <div className="flex flex-col gap-4">
        <section className="bg-surface-base rounded-2xl shadow-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <NicknameRow subscriptionId={detail.id} initialNickname={detail.nickname} />
          </div>
          <div className="flex-1">
            <SettingRow label="Setup" value={setupLabel} href={`/edit-setup/${detail.id}`} />
          </div>
        </section>

        <div className="flex flex-wrap items-stretch justify-center  gap-5 sm:gap-10">
          {detail.items.map((item) => (
            <RenewalDetailCard
              key={item.id}
              subscriptionId={detail.id}
              item={item}
              isLoyaltyEnabled={detail.isLoyaltyEnabled}
              isAdmin={isAdmin}
              availableLinkedProducts={detail.availableLinkedProducts}
            />
          ))}
        </div>
      </div>

      {isAdmin && detail.canAddP1Filter && (
        <div className="flex justify-center">
          <AddP1Filter subscriptionId={detail.id} />
        </div>
      )}

      {canRemoveSubscription && (
        <div className="flex justify-center pt-2">
          <RemoveButton
            label="Remove this filter"
            confirmTitle="Remove subscription?"
            confirmMessage="Are you sure you want to remove this subscription? All items will be deleted and this action cannot be undone."
            action={removeSubscription.bind(null, detail.id)}
          />
        </div>
      )}
    </div>
  );
}
