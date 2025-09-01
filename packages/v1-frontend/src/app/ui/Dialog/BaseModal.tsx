import { FC, ReactNode, useEffect } from 'react';
import { ModalController } from '../../hooks/useModal';
import cn from 'classnames';

export interface BaseDialogProps extends ModalController {
  children?: ReactNode;
  className?: string;
}

export const BaseModal: FC<BaseDialogProps> = ({
  setOpener,
  className,
  children,
}) => {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    setOpener(() => document.getElementById('my_modal_1')?.showModal());
  }, [setOpener]);

  return (
    <dialog id="my_modal_1" className="modal">
      <div className={cn('modal-box', className)}>{children}</div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};
