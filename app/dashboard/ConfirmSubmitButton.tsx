'use client';

import { MouseEvent } from 'react';
import { SubmitButton } from './SubmitButton';

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  confirmMessage: string;
  pendingText?: string;
  className?: string;
};

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  pendingText = 'Processing...',
  className = ''
}: ConfirmSubmitButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <span onClickCapture={handleClick}>
      <SubmitButton pendingText={pendingText} className={className}>
        {children}
      </SubmitButton>
    </span>
  );
}
