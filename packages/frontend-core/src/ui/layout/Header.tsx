import { Button } from '~/components/ui/button'

export function Header() {
  return (
    <header className="flex items-center justify-between bg-background shadow border-b px-4 py-2 mb-4">
      <div className="flex-1">
        <a className="text-xl font-semibold text-foreground">EnvHopper</a>
      </div>
      <div className="flex-none">
        <Button variant={'outline'}>Login</Button>
      </div>
    </header>
  )
}
