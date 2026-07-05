import type { ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModulePageProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ModulePage({ title, description, actions, children }: ModulePageProps) {
  return (
    <section className="mx-auto max-w-7xl pb-24">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Panel({
  children,
  className,
  title
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("rounded-md border bg-card shadow-sm", className)}>
      {title ? (
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">{title}</p>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-10 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

export const textareaClass =
  "min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

export function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid min-h-40 place-items-center px-4 py-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function SubmitButton({
  children,
  isLoading
}: {
  children: ReactNode;
  isLoading: boolean;
}) {
  return (
    <Button disabled={isLoading} type="submit">
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      <span>{children}</span>
    </Button>
  );
}

export function DeleteButton({
  confirmLabel = "Delete this record?",
  disabled,
  onClick
}: {
  confirmLabel?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label="Delete record"
      disabled={disabled}
      size="icon"
      type="button"
      variant="ghost"
      onClick={() => {
        if (window.confirm(confirmLabel)) {
          onClick();
        }
      }}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

export function DetailLink({ to }: { to: string }) {
  return (
    <Button asChild size="sm" type="button" variant="outline">
      <Link to={to}>Open</Link>
    </Button>
  );
}
