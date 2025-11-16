import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const IconComponent = icon || <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />;

  return (
    <div className="text-center py-12 border rounded-lg">
      {IconComponent}
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4">{description}</p>
      {actionLabel && (
        <>
          {actionHref ? (
            <Link href={actionHref}>
              <Button>{actionLabel}</Button>
            </Link>
          ) : onAction ? (
            <Button onClick={onAction}>{actionLabel}</Button>
          ) : null}
        </>
      )}
    </div>
  );
}

