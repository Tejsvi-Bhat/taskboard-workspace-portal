import { cn } from "@/lib/utils/cn";
import type { User } from "@/types/models";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Deterministic colored initials avatar. Falls back to a neutral chip. */
export function Avatar({
  user,
  size = 28,
  className,
}: {
  user: Pick<User, "name" | "avatarColor"> | null | undefined;
  size?: number;
  className?: string;
}) {
  if (!user) {
    return (
      <span
        className={cn("inline-flex items-center justify-center rounded-full bg-surface-muted text-muted", className)}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        title="Unassigned"
      >
        ?
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.36, backgroundColor: user.avatarColor }}
      title={user.name}
    >
      {initials(user.name)}
    </span>
  );
}
