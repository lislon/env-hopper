import { useRouter } from '@tanstack/react-router'
import { Share2Icon } from 'lucide-react'
import { use } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Link } from '~/components/ui/link'
import { EnvironmentContext, useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { ResourceJumpContext, useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { getEhToOptions } from '~/util/route-utils'

export function ShareLinkButton() {
  const maybeEnvContext = use(EnvironmentContext);
  const maybeResourceJumpContext = use(ResourceJumpContext);
  if (!maybeEnvContext || !maybeResourceJumpContext) {
    return null;
  }

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Share2Icon className="w-4 h-4" />
            Share link
          </Button>
        </DialogTrigger>
        <ShareDialogEnv />
      </form>
    </Dialog>
  )
}

function ShareDialogEnv() {
  const { currentEnv } = useEnvironmentContext()
  const { currentResourceJump } = useResourceJumpContext()
  const router = useRouter();

  const fullUrl =
    new URL(router.buildLocation(getEhToOptions({
    appId: currentResourceJump?.slug,
    envId: currentEnv?.slug,
  })).href, window.location.origin).toString()

  const isEnv = currentResourceJump === undefined
  

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {isEnv ? (
            <>
              Share Link to{' '}
              <code className="bg-accent p-1 rounded">
                {currentEnv?.displayName}
              </code>
            </>
          ) : (
            'Share Env-Hopper Link to this page'
          )}
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        {/* <div className="flex items-start gap-3">
          <Checkbox id="share-include-env" defaultChecked />
          <div className="grid gap-2">
            <Label htmlFor="share-include-env">Auto-select environment</Label>
            <p className="text-muted-foreground text-sm">
              Use when you want to share the application but not force a
              specific environment.
            </p>
          </div>
        </div> */}

        <div className="grid gap-3">
          <Label htmlFor="name-1">Formatted URL</Label>
        <Card>
          <CardContent>
            <Link
              {...getEhToOptions({
                appId: currentResourceJump?.slug,
                envId: currentEnv?.slug,
              })}
            >
              {currentEnv?.displayName} (Env-Hopper)
            </Link>
          </CardContent>
        </Card>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="share-raw-url">Raw URL</Label>
          <Input id="share-raw-url" name="share-raw-url" defaultValue={fullUrl} onClick={(e) => e.currentTarget.select()} />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}
