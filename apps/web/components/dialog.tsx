"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Glyph } from "./icons";
export function PanelDialog({
  title,
  description,
  trigger,
  children,
  open,
  onOpenChange,
  wide = false,
}: {
  title: string;
  description: string;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className={`dialog-content${wide ? " dialog-wide" : ""}`}
        >
          <div className="dialog-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <Glyph name="close" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="dialog-description">
            {description}
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
