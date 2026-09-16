type RewardTierFormValues = {
  title: string;
  description: string | null;
  targetAmount: number;
};

export function RewardTierForm({
  action,
  initial,
  submitLabel,
  errorMessage,
}: {
  action: (formData: FormData) => void;
  initial?: RewardTierFormValues;
  submitLabel: string;
  errorMessage?: string;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nombre del premio</label>
        <input
          name="title"
          required
          placeholder="Ej: Bolso de regalo"
          defaultValue={initial?.title}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Monto objetivo de ventas
        </label>
        <input
          name="targetAmount"
          type="number"
          min={1}
          step="1"
          required
          defaultValue={initial?.targetAmount}
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-400">
          Cuando el total comprado por la revendedora llegue a este monto, el objetivo queda
          cumplido.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Descripción (opcional)
        </label>
        <textarea
          name="description"
          rows={2}
          placeholder="Detalles del premio, cómo se entrega, etc."
          defaultValue={initial?.description ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="mt-2 self-start rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
