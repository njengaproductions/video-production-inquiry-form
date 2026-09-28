// components/admin/admin-backdrop.tsx — calligraphy backdrop for the back office.
// A fixed layer (not background-attachment: fixed), so it also behaves on iPhone.
export function AdminBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-right"
      style={{ backgroundColor: "#121110", backgroundImage: "url('/images/admin-bg.webp')" }}
    >
      {/* Soft left-side shade keeps the content column calm while the script stays visible on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
    </div>
  )
}
