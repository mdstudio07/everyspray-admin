/**
 * Form Error Message Component
 *
 * Reusable error message display for form validation errors.
 * Follows Rule 2 (Specific naming) and Rule 58 (DRY for UI patterns).
 *
 * Usage:
 * <FormErrorMessage id="email-error" message={errors.email?.message} />
 */

interface FormErrorMessageProps {
  id: string;
  message?: string;
  className?: string;
}

export function FormErrorMessage({
  id,
  message,
  className = '',
}: FormErrorMessageProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      className={`text-xs  text-destructive ${className}`}
      role="alert"
    >
      {message}
    </p>
  );
}
