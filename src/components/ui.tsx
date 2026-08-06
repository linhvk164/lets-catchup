import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary:
      "bg-ocean-deep text-paper hover:bg-ocean",
    secondary:
      "border border-ink/15 bg-white/55 text-ink backdrop-blur-sm hover:bg-white/80",
    ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/** Subtle label-row action (font switch, timezone search, etc.). Icon first. */
export function FieldActionButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white/55 px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-ink/15 hover:bg-white/80 hover:text-ink ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  requiredMark?: boolean;
};

export function Field({
  label,
  hint,
  error,
  requiredMark,
  className = "",
  id,
  ...props
}: FieldProps) {
  const fieldId = id ?? props.name;
  return (
    <label className="block space-y-2" htmlFor={fieldId}>
      <span className="text-sm font-medium text-ink">
        {label}
        {requiredMark || props.required ? (
          <span className="ml-0.5 text-stamp">*</span>
        ) : null}
      </span>
      <input
        id={fieldId}
        className={`w-full rounded-xl border bg-white/70 px-4 py-3 text-base text-ink outline-none ring-ocean/30 placeholder:text-ink-soft/50 focus:border-ocean/40 focus:ring-2 ${
          error ? "border-stamp/60" : "border-ink/10"
        } ${className}`}
        {...props}
      />
      {error ? <span className="block text-sm text-stamp">{error}</span> : null}
      {!error && hint ? <span className="block text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
  requiredMark?: boolean;
  labelAction?: ReactNode;
};

export function TextArea({
  label,
  hint,
  error,
  requiredMark,
  labelAction,
  className = "",
  id,
  ...props
}: TextAreaProps) {
  const fieldId = id ?? props.name;
  return (
    <div className="block space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          {label}
          {requiredMark || props.required ? (
            <span className="ml-0.5 text-stamp">*</span>
          ) : null}
        </label>
        {labelAction}
      </div>
      <textarea
        id={fieldId}
        className={`min-h-14 w-full resize-y rounded-xl border bg-white/70 px-4 py-2.5 text-base text-ink outline-none ring-ocean/30 placeholder:text-ink-soft/50 focus:border-ocean/40 focus:ring-2 ${
          error ? "border-stamp/60" : "border-ink/10"
        } ${className}`}
        {...props}
      />
      {error ? <span className="block text-sm text-stamp">{error}</span> : null}
      {!error && hint ? <span className="block text-xs text-ink-soft">{hint}</span> : null}
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3.5 py-2 text-sm transition ${
        active
          ? "bg-ocean-deep text-paper"
          : "border border-ink/10 bg-white/55 text-ink-soft hover:bg-white/80"
      }`}
    >
      {children}
    </button>
  );
}

export function ValidationSummary({
  missing,
}: {
  missing: string[];
}) {
  if (missing.length === 0) return null;
  return (
    <div
      className="rounded-xl border border-stamp/30 bg-[#f8ebe7] px-4 py-3 text-sm text-stamp"
      role="alert"
    >
      <p className="font-medium">Please complete:</p>
      <ul className="mt-1.5 space-y-0.5">
        {missing.map((item) => (
          <li key={item}>✕ {item}</li>
        ))}
      </ul>
    </div>
  );
}
