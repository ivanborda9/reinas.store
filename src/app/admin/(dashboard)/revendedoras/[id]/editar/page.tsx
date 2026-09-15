import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResellerForm } from "@/components/admin/ResellerForm";
import { updateReseller } from "../../actions";

export default async function EditResellerPage({ params }: { params: { id: string } }) {
  const reseller = await prisma.reseller.findUnique({ where: { id: params.id } });
  if (!reseller) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Editar revendedora</h1>
      <ResellerForm
        action={updateReseller.bind(null, reseller.id)}
        initial={{
          name: reseller.name,
          email: reseller.email,
          phone: reseller.phone,
          city: reseller.city,
          code: reseller.code,
          discountPercent: reseller.discountPercent,
        }}
        submitLabel="Guardar cambios"
        hasPassword={Boolean(reseller.passwordHash)}
      />
    </div>
  );
}
