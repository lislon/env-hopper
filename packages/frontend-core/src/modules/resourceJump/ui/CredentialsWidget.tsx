import { Input } from '~/components/ui/input'

export function CredentialsWidget() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-secondary-foreground/60">
        Credentials
      </h2>
      <div className="flex flex-col gap-2">
        <Input placeholder="Username" />
        <Input placeholder="Password" type="password" />
      </div>
    </div>
  )
}

