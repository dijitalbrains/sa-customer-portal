import { getAuth } from "@/lib/auth";
import { getInfoSheet } from "@/lib/services/info-sheet-service";
import InfoSheetCard from "./_components/info-sheet-card";
import ProductSection from "./_components/product-section";
import SendEmailButton from "./_components/send-email-button";

export default async function InfoSheetPage() {
  const { userId, isAdmin } = await getAuth();
  const sheet = await getInfoSheet(userId);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-text-heading">
            Customer Info Sheet
          </h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            A summary of your account, products, and support resources.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/info-sheet/pdf?mode=view"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-pill bg-brand-gradient px-5 text-[12px] font-semibold text-white shadow-button cursor-pointer hover:opacity-90"
          >
            View PDF
          </a>
          <a
            href="/info-sheet/pdf?mode=download"
            className="inline-flex h-9 items-center justify-center rounded-pill border border-brand-primary/40 bg-white px-5 text-[12px] font-semibold text-brand-primary cursor-pointer hover:bg-brand-surface"
          >
            Download PDF
          </a>
          {isAdmin && <SendEmailButton email={sheet.customerEmail} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <InfoSheetCard title="Customer Information">
          <div className="flex flex-col gap-2 text-[13px]">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field label="Name" value={sheet.customerName} />
              <Field label="Phone" value={sheet.customerPhone} />
            </div>
            <Field label="Email" value={sheet.customerEmail} />
            <Field label="Address" value={sheet.customerAddress} />
          </div>
        </InfoSheetCard>

        <InfoSheetCard title="Account Login Information">
          <div className="flex flex-col gap-2 rounded-xl bg-surface-overlay/70 border border-border-subtle/40 p-4 text-[13px]">
            <p>
              <span className="font-semibold text-text-heading">Portal URL:</span>{" "}
              <ExternalLink href={sheet.portalUrl} />
            </p>
            <Field label="Login Email" value={sheet.customerEmail} />
            <p className="text-text-muted">
              <span className="font-semibold text-text-heading">Instructions:</span>{" "}
              Visit the portal URL above and log in with your email and the password you
              set up. If you haven&apos;t set a password yet, use the &quot;Forgot
              Password&quot; link to create one.
            </p>
          </div>
        </InfoSheetCard>
      </div>

      <InfoSheetCard title="Product Information">
        {sheet.productSections.length > 0 ? (
          <div className="flex flex-col gap-4">
            {sheet.productSections.map((section, index) => (
              <ProductSection key={index} section={section} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-text-muted">No products found</p>
        )}
      </InfoSheetCard>

      <InfoSheetCard title="Support & Resources">
        <div className="flex flex-col gap-2 rounded-xl bg-surface-overlay/70 border border-border-subtle/40 p-4 text-[13px]">
          <p>
            <span className="font-semibold text-text-heading">Product Support:</span>{" "}
            <ExternalLink href={sheet.productSupportUrl} />
          </p>
          <p>
            <span className="font-semibold text-text-heading">Customer Service:</span>{" "}
            <ExternalLink href={sheet.customerServiceUrl} />
          </p>
          <p className="text-text-muted">
            Visit the customer service link above to create a support ticket
          </p>
        </div>
      </InfoSheetCard>

      {sheet.emergencyPhone && (
        <InfoSheetCard title="Emergency Contact">
          <p className="text-center text-[13px] text-text-muted">
            For urgent assistance, text or call:{" "}
            <span className="font-semibold text-text-heading">
              {sheet.emergencyPhone}
            </span>
          </p>
        </InfoSheetCard>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-text-muted">
      <span className="font-semibold text-text-heading">{label}:</span>{" "}
      {value || "—"}
    </p>
  );
}

function ExternalLink({ href }: { href: string }) {
  if (!href) return <span className="text-text-muted">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-primary hover:underline cursor-pointer break-all"
    >
      {href}
    </a>
  );
}
