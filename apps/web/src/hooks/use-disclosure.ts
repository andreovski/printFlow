import { useEffect, useState, useCallback, useMemo } from 'react';

export type StateType<T = any> = {
  state: T;
};

export type DisclosureType<IState = any> = {
  isOpen: boolean;
  open: (state?: StateType<IState>) => void;
  close: (state?: StateType<IState>) => void;
  toggle: (state?: StateType<IState>) => void;
  state?: IState;
};

type DisclosureProps = {
  opened?: boolean;
  onOpen?: (value: boolean) => void;
  onClose?: (value: boolean) => void;
};

export const useDisclosure = (disclosure?: DisclosureProps): DisclosureType => {
  const [isOpen, setIsOpen] = useState(() => !!disclosure?.opened);
  const [state, setState] = useState<StateType>({ state: null });

  const { opened, onOpen, onClose } = useMemo(
    () => ({
      opened: disclosure?.opened,
      onOpen: disclosure?.onOpen,
      onClose: disclosure?.onClose,
    }),
    [disclosure?.opened, disclosure?.onOpen, disclosure?.onClose]
  );

  useEffect(() => {
    setIsOpen(!!opened);
  }, [opened]);

  const open = useCallback(
    (newState?: StateType) => {
      if (newState) setState(newState);
      setIsOpen(true);
      onOpen?.(true);
    },
    [onOpen]
  );

  const close = useCallback(
    (newState?: StateType) => {
      if (newState) {
        setState(newState);
      } else {
        setState({ state: null });
      }
      setIsOpen(false);
      onClose?.(false);
    },
    [onClose]
  );

  const toggle = useCallback(
    (newState?: StateType) => {
      if (isOpen) {
        close(newState);
      } else {
        open(newState);
      }
    },
    [isOpen, close, open]
  );

  return useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      state: state.state,
    }),
    [isOpen, open, close, toggle, state.state]
  );
};
