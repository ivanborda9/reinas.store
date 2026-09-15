type ResellerFormValues = {
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  code: string;
  discountPercent: number;
};

export function ResellerForm({
  action,
  initial,
  submitLabel,
  errorMessage,
  hasPassword,
}: {
  action: (formData: FormData) => void;
  initial?: ResellerFormValues;
  submitLabel: string;
  errorMessage?: string;
  hasPassword?: boolean;
}) {
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
        <input
          name="name"
          required
          defaultValue={initial?.name}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email (opcional)</label>
          <input
            name="email"
            type="email"
            defaultValue={initial?.email ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono (opcional)</label>
          <input
            name="phone"
            defaultValue={initial?.phone ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Localidad (opcional)</label>
        <input
          name="city"
          placeholder="Ej: Rosario, Santa Fe"
          defaultValue={initial?.city ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-400">Para organizar los envíos de sus pedidos.</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Código de revendedora</label>
        <input
          name="code"
          required
          placeholder="Ej: ANA10"
          defaultValue={initial?.code}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase"
        />
        <p className="mt-1 text-xs text-gray-400">
          Es el código que ella usa para comprar en la tienda a precio mayorista.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Descuento mayorista para ella (%)
        </label>
        <input
          name="discountPercent"
          type="number"
          min={0}
          max={100}
          step="0.1"
          required
          defaultValue={initial?.discountPercent}
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-400">
          Lo que paga de menos al comprar con su código. Ella después revende cada prenda al precio
          que quiera: la diferencia es su ganancia, y no la vemos ni la manejamos nosotros.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {hasPassword ? "Nueva contraseña para su panel (opcional)" : "Contraseña para su panel (opcional)"}
        </label>
        <input
          name="password"
          type="password"
          minLength={6}
          placeholder={hasPassword ? "Dejar vacío para no cambiarla" : "Sin contraseña no puede loguearse"}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-400">
          Con email y esta contraseña, la revendedora puede entrar a /revendedora/login a ver su
          historial de compras.
        </p>
      </div>
      <button
        type="submit"
        className="mt-2 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
