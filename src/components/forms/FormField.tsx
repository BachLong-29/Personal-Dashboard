import type { FieldError } from 'react-hook-form';

import { Input, type InputProps } from '@/components/ui';

interface FormFieldProps extends Omit<InputProps, 'error'> {
  error?: FieldError;
}

export function FormField({ error, ...props }: FormFieldProps) {
  return <Input error={error?.message} {...props} />;
}
