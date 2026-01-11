interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 48 }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="ORI-RM Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
