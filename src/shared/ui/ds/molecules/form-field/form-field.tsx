import { Input, type InputProps } from '../../atoms/input';

/**
 * Design System Form Field — Label + Input + Helper/Error text
 *
 * @figma Vit IELTS — Login/Sign Up forms
 */

export type FormFieldProps = InputProps & {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
};

export const FormField = ({
  label,
  helperText,
  errorMessage,
  required = false,
  error,
  id,
  ...inputProps
}: FormFieldProps) => {
  const fieldId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = error || !!errorMessage;

  return (
    <div className={`form-field ${hasError ? 'form-field--error' : ''}`}>
      {label && (
        <label className="form-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="form-field__required">*</span>}
        </label>
      )}
      <Input {...inputProps} id={fieldId} error={hasError} fullWidth />
      {(errorMessage || helperText) && (
        <span className={`form-field__helper ${hasError ? 'form-field__helper--error' : ''}`}>
          {errorMessage || helperText}
        </span>
      )}
    </div>
  );
};
