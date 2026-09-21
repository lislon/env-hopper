export interface OverlayProps {
  children?: React.ReactNode;
  onClose?: () => void;
}

export function Overlay({ children, onClose }: OverlayProps) {
  return (
    <div
      className="bg-black bg-opacity-50 inset-0 flex justify-center items-center w-full h-full fixed z-[9999] transition-opacity"
      onClick={() => onClose?.()}
    >
      {children}
    </div>
  );
}
