import { useCallback, useMemo, useState } from 'react';

export type Opener = () => void;
export type ModalController = {
  isOpen: boolean;
  close: () => void;
  setOpener: (opener: Opener) => void;
};

export type OpenModalFn = () => void;
export type ModalReturn = [OpenModalFn, ModalController];

export function useModal(): ModalReturn {
  const [isOpened, setIsOpened] = useState(false);
  const [opener, setOpener] = useState<Opener | undefined>(undefined);

  const openDialog = useCallback(() => opener?.(), [opener]);

  const setOpenerSimple = useCallback((opener: Opener) => {
    setOpener(() => opener);
  }, []);

  return useMemo(() => {
    const controller = {
      isOpen: isOpened,
      close: () => setIsOpened(false),
      setOpener: setOpenerSimple,
    };
    return [openDialog, controller];
  }, [isOpened, openDialog, setOpenerSimple]);
}
