import Link from "next/link";

const NAV = [
  {
    title: "Tienda",
    links: [
      { label: "Todos los productos", href: "/shop" },
      { label: "Procesadores", href: "/shop?type=CPU" },
      { label: "Tarjetas gráficas", href: "/shop?type=GPU" },
      { label: "Memorias RAM", href: "/shop?type=Memory" },
      { label: "Almacenamiento", href: "/shop?type=Storage" },
    ],
  },
  {
    title: "Herramientas",
    links: [
      { label: "PC Builder", href: "/builder" },
      { label: "Asistente IA", href: "#" },
      { label: "Ver tienda", href: "/shop" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { label: "Acerca de", href: "#" },
      { label: "Contacto", href: "#" },
      { label: "Privacidad", href: "#" },
      { label: "Términos", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
      <div className="mx-auto w-full max-w-7xl px-6 pt-14 pb-8">
        {/* Grid-mesh: brand + 3 nav columns */}
        <div className="grid-mesh mb-12 grid grid-cols-2 md:grid-cols-4">
          {/* Brand column */}
          <div className="grid-mesh-item col-span-2 flex flex-col justify-between gap-10 p-6 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-xs font-bold text-white">
                P
              </span>
              <span className="font-semibold text-[var(--text-primary)]">PC Store</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Configurador inteligente de componentes con validación de compatibilidad en tiempo real y asistencia de IA incluida.
            </p>
          </div>

          {/* Nav sections */}
          {NAV.map((section) => (
            <div key={section.title} className="grid-mesh-item p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                {section.title}
              </p>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-tertiary)]">
            © 2026 PC Store · Todos los derechos reservados.
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Construido con Next.js &amp; Stripe
          </p>
        </div>
      </div>
    </footer>
  );
}
