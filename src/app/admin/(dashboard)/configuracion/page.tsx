import { getSiteSettings } from "@/lib/settings";
import { saveSiteSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: { guardado?: string };
}) {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Configuración del sitio</h1>
      <p className="mb-6 text-sm text-gray-500">
        Cambios de nombre, color, banner y WhatsApp. Se aplican al instante, sin necesidad de tocar
        código.
      </p>

      {searchParams.guardado && (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          Cambios guardados. Recargá el sitio público para verlos.
        </p>
      )}

      <form action={saveSiteSettings} className="flex max-w-xl flex-col gap-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nombre de la tienda</label>
          <input
            name="storeName"
            required
            defaultValue={settings.storeName}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Color principal</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="primaryColor"
              defaultValue={settings.primaryColor}
              className="h-11 w-16 cursor-pointer rounded-lg border border-gray-300"
            />
            <span className="text-sm text-gray-500">
              Se usa en botones, links y encabezados de todo el sitio.
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Título del banner</label>
          <input
            name="bannerTitle"
            required
            defaultValue={settings.bannerTitle}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Subtítulo del banner</label>
          <textarea
            name="bannerSubtitle"
            required
            rows={2}
            defaultValue={settings.bannerSubtitle}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Imagen de fondo del banner (opcional)
          </label>
          <input
            name="bannerImageUrl"
            placeholder="https://..."
            defaultValue={settings.bannerImageUrl ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-400">
            Si la dejás vacía, se usa un degradé con el color principal.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Número de WhatsApp del negocio
          </label>
          <input
            name="whatsappNumber"
            placeholder="5491122334455"
            defaultValue={settings.whatsappNumber}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-400">
            Formato internacional, sin "+" ni espacios. Se usa en el botón de WhatsApp del checkout.
          </p>
        </div>

        <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-brand-800">Datos para transferencia</h2>
          <p className="mb-3 text-xs text-brand-700">
            Se muestran a la clienta después de confirmar su compra, para que transfiera y envíe el
            comprobante.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Alias</label>
              <input
                name="transferAlias"
                required
                defaultValue={settings.transferAlias}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Titular</label>
              <input
                name="transferHolderName"
                required
                defaultValue={settings.transferHolderName}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Número para enviar el comprobante
              </label>
              <input
                name="transferPhone"
                required
                defaultValue={settings.transferPhone}
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Margen de ganancia objetivo (%)
          </label>
          <input
            name="targetMarginPercent"
            type="number"
            min={0}
            max={100}
            step="0.1"
            placeholder="Ej: 40"
            defaultValue={settings.targetMarginPercent ?? ""}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-400">
            Se usa en Reportes para mostrar si el margen promedio de tus productos activos llega a
            este objetivo. Dejalo vacío si no querés fijar uno.
          </p>
        </div>

        <button
          type="submit"
          className="mt-2 self-start rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
