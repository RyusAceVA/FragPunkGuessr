import { cn } from "@/lib/utils";

/**
 * Conteneur de page standard : largeur max, gouttières responsives,
 * espacement vertical homogène.
 */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6 sm:py-12",
        className,
      )}
    >
      {children}
    </div>
  );
}
