import Link from "next/link";
import { logoutAction } from "../login/actions";
import { getAdminRole } from "@/lib/adminSession";

const ownerLinks = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/revendedoras", label: "Revendedoras" },
  { href: "/admin/regalos", label: "Regalos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/configuracion", label: "Configuración" },
];

const employeeLinks = [{ href: "/admin/pedidos", label: "Pedidos" }];

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const role = await getAdminRole();
  const links = role === "empleado" ? employeeLinks : ownerLinks;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white p-4 sm:flex">
        <span className="mb-6 text-lg font-bold text-brand-700">Panel admin</span>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 pt-6">
          <Link href="/" className="text-sm text-brand-600 hover:underline">
            Ver sitio público
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-red-500 hover:underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:hidden">
          <span className="font-bold text-brand-700">Panel admin</span>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-red-500">
              Salir
            </button>
          </form>
        </header>
        <nav className="flex gap-3 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 text-sm sm:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap text-gray-700">
              {link.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
