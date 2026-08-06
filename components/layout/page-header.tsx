import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Actions affichées à droite du titre (boutons, filtres…) */
  children?: React.ReactNode;
  className?: string;
}

/**
 * En-tête standard de page — garantit une hiérarchie visuelle
 * cohérente sur toutes les sections de l'app.
 */
export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
}
