import { notFound } from "next/navigation";
import PaymentMethod from "@/components/shared/payment-method";
import { getAccount } from "@/lib/actions/user.actions";
import Header from "./_components/header";
import PersonalInfo from "./_components/personal-info";
import ChangePassword from "./_components/change-password";
import ManageCard, { ManageRow } from "./_components/manage-card";
import { TruckIcon, PaymentIcon, SpeakerIcon } from "./_components/icons";

export default async function AccountPage() {
  const account = await getAccount();
  if (!account) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Header user={account.user} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5">
          <PersonalInfo user={account.user} />
          <ChangePassword />
        </div>

        <div className="flex flex-col gap-5">
          <ManageCard
            icon={<TruckIcon />}
            title="Shipping Address"
            manageLabel="Manage Addresses"
            manageHref="/addresses"
          >
            {account.address ? (
              <ManageRow
                title={`${account.addressCount} ${account.addressCount === 1 ? "address" : "addresses"} saved`}
                description={account.address.formatted}
                isDefault={account.address.isDefault}
              />
            ) : (
              <ManageRow title="No address saved" />
            )}
          </ManageCard>

          <ManageCard
            icon={<PaymentIcon />}
            title="Payment Methods"
            manageLabel="Manage Payments"
            manageHref="/payments"
          >
            {account.card.payment ? (
              <ManageRow
                title={`${account.cardCount} ${account.cardCount === 1 ? "card" : "cards"} saved`}
                description={<PaymentMethod payment={account.card.payment} />}
                isDefault={account.card.isDefault}
              />
            ) : (
              <ManageRow title="No card saved" description="Credit / Debit Cards" />
            )}

            {account.bank.payment ? (
              <ManageRow
                title={`${account.bankCount} ${account.bankCount === 1 ? "account" : "accounts"} saved`}
                description={<PaymentMethod payment={account.bank.payment} />}
                isDefault={account.bank.isDefault}
              />
            ) : (
              <ManageRow title="Bank Account" description="No bank account saved" />
            )}
          </ManageCard>

          <ManageCard
            icon={<SpeakerIcon />}
            title="Renewal Reminders"
            manageLabel="Manage Reminders"
            manageHref="/alerts"
          >
            <ManageRow
              title={`${account.subscriptionCount} ${account.subscriptionCount === 1 ? "renewal" : "renewals"} saved`}
            />
          </ManageCard>
        </div>
      </div>
    </div>
  );
}
