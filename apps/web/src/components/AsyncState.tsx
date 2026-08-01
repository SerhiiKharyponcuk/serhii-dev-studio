import { CircleAlert, Inbox, LoaderCircle } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";

type AsyncStateProps = {
  className?: string;
  description?: string | undefined;
  title?: string | undefined;
};

export function LoadingState({
  className = "",
  title = "Loading content"
}: Pick<AsyncStateProps, "className" | "title">) {
  const { t } = useI18n();
  return (
    <div
      className={`glass card async-state ${className}`}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <span className="sr-only">{t(title)}</span>
      <div className="skeleton h-4 w-28 rounded-full" />
      <div className="skeleton mt-5 h-7 w-3/5 rounded-lg" />
      <div className="skeleton mt-4 h-4 w-full rounded-full" />
      <div className="skeleton mt-2 h-4 w-4/5 rounded-full" />
    </div>
  );
}

export function EmptyState({
  className = "",
  title = "No activity yet",
  description = "New items will appear here automatically."
}: AsyncStateProps) {
  const { t } = useI18n();
  return (
    <div className={`glass card async-state ${className}`}>
      <span className="async-state-icon" aria-hidden="true">
        <Inbox size={19} />
      </span>
      <div>
        <h2 className="font-semibold text-white">{t(title)}</h2>
        <p className="muted mt-1.5 text-sm">{t(description)}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  className = "",
  title = "Unable to load this section",
  description = "Please try again in a moment."
}: AsyncStateProps) {
  const { t } = useI18n();
  return (
    <div className={`glass card async-state ${className}`} role="alert">
      <span className="async-state-icon async-state-icon-error" aria-hidden="true">
        <CircleAlert size={19} />
      </span>
      <div>
        <h2 className="font-semibold text-red-100">{t(title)}</h2>
        <p className="mt-1.5 text-sm text-red-200/75">{t(description)}</p>
      </div>
    </div>
  );
}

export function LoadingLabel({ children }: { children: string }) {
  return (
    <>
      <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
      {children}
    </>
  );
}
