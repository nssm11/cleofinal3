export function Atmosphere({ children, tone, rules, className }: { children?: React.ReactNode; tone?: string; rules?: boolean; className?: string }) {
  return <div className={className}>{children}</div>;
}
