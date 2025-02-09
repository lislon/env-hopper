import { DefaultErrorComponent } from './DefaultErrorComponent'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function RooutErrorPage(props: ErrorComponentProps) {
  return (
    <div className="p-5">
      <DefaultErrorComponent {...props} />;
    </div>
  )
}
