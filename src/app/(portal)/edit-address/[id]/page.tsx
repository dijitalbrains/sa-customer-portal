import Breadcrumb from "@/components/ui/breadcrumb";

interface EditAddressPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAddressPage({ params }: EditAddressPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Edit Address" }]} />
      <h1 className="text-[26px] font-bold text-text-heading">Edit Address</h1>
      <p className="text-[13px] text-text-muted">Subscription item #{id}</p>
    </div>
  );
}
