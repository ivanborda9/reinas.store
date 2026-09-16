import { RewardTierForm } from "@/components/admin/RewardTierForm";
import { createRewardTier } from "../actions";

export default function NewRewardTierPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Nuevo premio</h1>
      <RewardTierForm action={createRewardTier} submitLabel="Crear premio" errorMessage={searchParams.error} />
    </div>
  );
}
