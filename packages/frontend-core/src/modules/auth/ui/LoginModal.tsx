import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/ui/dialog'
import { useAuthModal } from '../AuthModalContext'
import { LoginPage } from './LoginPage'

/**
 * LoginModal renders a dialog with login form
 * Controlled by AuthModalContext global state
 * Can be opened from anywhere using useAuthModal hook
 */
export function LoginModal() {
  const { isOpen, close } = useAuthModal()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        close()
      }
    }}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Choose your sign-in method to access EnvHopper
          </DialogDescription>
        </DialogHeader>
        <LoginPage onSuccess={close} />
      </DialogContent>
    </Dialog>
  )
}
