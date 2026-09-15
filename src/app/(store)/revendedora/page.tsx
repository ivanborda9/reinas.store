import Link from "next/link";

export default function RevendedoraLandingPage() {
  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <h1 className="text-3xl font-bold text-gray-900">¿Querés ser revendedora?</h1>
      <p className="mt-3 text-gray-600">
        Sumate con tu propio código: comprás las prendas a precio mayorista y las revendés al
        precio que vos quieras. La diferencia es tu ganancia.
      </p>

      <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-brand-600">1</p>
          <p className="mt-1 text-sm text-gray-700">Te registrás gratis con tus datos.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-brand-600">2</p>
          <p className="mt-1 text-sm text-gray-700">
            Recibís tu código propio para comprar a precio mayorista.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-brand-600">3</p>
          <p className="mt-1 text-sm text-gray-700">
            Le mostrás la prenda a tu clienta, le ponés el precio que quieras y comprás en la
            página cuando ya tengas la venta hecha.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/revendedora/registro"
          className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Quiero registrarme
        </Link>
        <Link
          href="/revendedora/login"
          className="rounded-lg border border-brand-600 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50"
        >
          Ya soy revendedora, iniciar sesión
        </Link>
      </div>
    </div>
  );
}
