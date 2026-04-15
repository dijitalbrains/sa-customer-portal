import Breadcrumb from "@/components/ui/breadcrumb";

interface EditPreferencesPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPreferencesPage({ params }: EditPreferencesPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Edit Preferences" }]} />
      <h1 className="text-[26px] font-bold text-text-heading">Edit Preferences</h1>
      <p className="text-[13px] text-text-muted">Subscription item #{id}</p>
    </div>
  );
}
