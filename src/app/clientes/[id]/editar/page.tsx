import EditClientForm from "./EditClientForm";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditClientForm id={id} />;
}
