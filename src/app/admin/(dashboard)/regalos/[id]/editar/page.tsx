import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RewardTierForm } from "@/components/admin/RewardTierForm";
import { updateRewardTier } from "../../actions";

export default async function EditRewardTierPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const tier = await prisma.rewardTier.findUnique({ where: { id: params.id } });
  if (!tier) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Editar regalo</h1>
      <RewardTierForm
        action={updateRewardTier.bind(null, tier.id)}
        initial={{
          title: tier.title,
          description: tier.description,
          targetAmount: tier.targetAmount,
        }}
        submitLabel="Guardar cambios"
        errorMessage={searchParams.error}
      />
    </div>
  );
}
