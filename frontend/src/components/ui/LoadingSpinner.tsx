export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 border-3 border-forest-200 border-t-forest-600 rounded-full animate-spin"
        style={{ borderTopColor: "#2d6942", borderColor: "#dff0e5", borderWidth: 3 }} />
      <span className="text-sm text-neutral-500">{message}</span>
    </div>
  );
}