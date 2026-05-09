export default function EmptyState({
  message = "Aucun personnage trouvé",
}: {
  message?: string;
}) {
  return (
    <div className="text-center py-10 text-text-faint text-sm">
      <i
        className="ti ti-ghost text-2xl block mb-2 opacity-30"
        aria-hidden="true"
      />
      {message}
    </div>
  );
}
