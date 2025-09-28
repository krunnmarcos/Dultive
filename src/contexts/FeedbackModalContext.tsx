import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import FeedbackModal, { FeedbackModalProps, ModalAction, ModalType } from '../components/FeedbackModal';

interface ShowModalOptions {
  title: string;
  message?: string;
  type?: ModalType;
  actions?: ModalAction[];
  dismissible?: boolean;
}

interface FeedbackModalContextValue {
  showModal: (options: ShowModalOptions) => void;
  hideModal: () => void;
}

interface FeedbackModalState extends ShowModalOptions {
  visible: boolean;
}

const FeedbackModalContext = createContext<FeedbackModalContextValue | undefined>(undefined);

export const FeedbackModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<FeedbackModalState>({
    visible: false,
    title: '',
    message: undefined,
    type: 'info',
    actions: undefined,
    dismissible: true,
  });

  const hideModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showModal = useCallback((options: ShowModalOptions) => {
    setModalState({
      visible: true,
      title: options.title,
      message: options.message,
      type: options.type ?? 'info',
      actions: options.actions,
      dismissible: options.dismissible ?? true,
    });
  }, []);

  const handleActionPress = useCallback(
    (action: ModalAction) => {
      if (action.dismiss !== false) {
        hideModal();
      }
      action.onPress?.();
    },
    [hideModal]
  );

  const providerValue = useMemo(() => ({ showModal, hideModal }), [showModal, hideModal]);

  return (
    <FeedbackModalContext.Provider value={providerValue}>
      {children}
      <FeedbackModal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        actions={modalState.actions}
        dismissible={modalState.dismissible}
        onClose={hideModal}
        onActionPress={handleActionPress}
      />
    </FeedbackModalContext.Provider>
  );
};

export const useFeedbackModal = (): FeedbackModalContextValue => {
  const context = useContext(FeedbackModalContext);
  if (!context) {
    throw new Error('useFeedbackModal deve ser usado dentro de um FeedbackModalProvider');
  }
  return context;
};
