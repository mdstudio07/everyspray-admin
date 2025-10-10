/**
 * Password Strength Indicator Component
 *
 * Displays visual feedback for password strength with semantic colors.
 * Follows Rules 41 (spacing scale), 43 (semantic colors), 46 (accessibility)
 */

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  /**
   * Calculate password strength score (0-6)
   * Criteria: length (2 points), character variety (4 points)
   */
  const getStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const strength = getStrength(password);

  /**
   * Get semantic color based on strength
   * Uses semantic tokens (Rule 43) instead of hardcoded colors
   */
  const getColor = (): string => {
    if (strength < 3) return 'bg-destructive';
    if (strength < 5) return 'bg-warning';
    return 'bg-success';
  };

  const getLabel = (): string => {
    if (strength < 3) return 'Weak';
    if (strength < 5) return 'Medium';
    return 'Strong';
  };

  const getAriaLabel = (): string => {
    return `Password strength: ${getLabel()}. ${strength} out of 6 criteria met.`;
  };

  // Don't show if password is empty
  if (!password) return null;

  return (
    <div className="space-y-2" role="status" aria-live="polite" aria-label={getAriaLabel()}>
      {/* Strength bars - using gap-2 (8px from spacing scale, Rule 41) */}
      <div className="flex gap-2" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-sm transition-colors duration-150 ${
              i < strength ? getColor() : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p className="text-xs text-muted-foreground">
        Password strength:{' '}
        <span
          className="font-medium"
          aria-label={`Password is ${getLabel().toLowerCase()}`}
        >
          {getLabel()}
        </span>
      </p>
    </div>
  );
}
