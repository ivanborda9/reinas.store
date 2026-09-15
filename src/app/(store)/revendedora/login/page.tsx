import Link from "next/link";
import { loginReseller } from "../actions";

export default function LoginRevendedoraPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Ingresá a tu panel</h1>
      <p className="mb-6 text-sm text-gray-500">Revisá tu historial de compras a precio mayorista.</p>

      {searchParams.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Email o contraseña incorrectos.
        </p>
      )}

      <form action={loginReseller} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            required
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
        >
          Ingresar
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/revendedora/registro" className="text-brand-600 hover:underline">
          Registrate acá
        </Link>
      </p>
    </div>
  );
}
