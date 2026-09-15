import { ResellerForm } from "@/components/admin/ResellerForm";
import { createReseller } from "../actions";

export default function NewResellerPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Nueva revendedora</h1>
      <ResellerForm
        action={createReseller}
        submitLabel="Crear revendedora"
        errorMessage={searchParams.error}
        initial={{
          name: "",
          email: "",
          phone: "",
          city: "",
          code: "",
          discountPercent: 10,
        }}
      />
    </div>
  );
}
