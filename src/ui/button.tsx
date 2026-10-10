import type { ButtonHTMLAttributes } from "react";

const tones = {
  solid: "bg-primary text-primary-foreground hover:bg-primary/88",
  danger:
    "bg-destructive/10 text-destructive hover:bg-destructive/18 dark:bg-destructive/20 dark:hover:bg-destructive/30",
};

export function Button({
  tone = "solid",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof tones }) {
  return (
    <button
      type="button"
      {...props}
      className={`press inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-5 text-sm font-medium whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50 ${tones[tone]} ${className}`}
    />
  );
}

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
