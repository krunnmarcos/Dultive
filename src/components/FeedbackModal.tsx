import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

export type ModalType = 'info' | 'success' | 'error' | 'warning';

export type ModalAction = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  dismiss?: boolean;
};

export interface FeedbackModalProps {
  visible: boolean;
  type?: ModalType;
  title: string;
  message?: string;
  dismissible?: boolean;
  actions?: ModalAction[];
  onClose: () => void;
  onActionPress: (action: ModalAction) => void;
}

const iconConfig: Record<ModalType, { name: keyof typeof Ionicons.glyphMap; color: string; background: string }> = {
  info: { name: 'information-circle', color: COLORS.primary, background: `${COLORS.secondary}` },
  success: { name: 'checkmark-circle', color: COLORS.success, background: 'rgba(46, 125, 50, 0.15)' },
  error: { name: 'close-circle', color: COLORS.error, background: 'rgba(255, 68, 68, 0.15)' },
  warning: { name: 'alert-circle', color: COLORS.warning, background: 'rgba(249, 168, 37, 0.18)' },
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  type = 'info',
  title,
  message,
  dismissible = true,
  actions,
  onClose,
  onActionPress,
}) => {
  const icon = iconConfig[type];

  const renderActionButton = (action: ModalAction, index: number) => {
    const buttonStyles: ViewStyle[] = [styles.actionButton];
    const textStyles: TextStyle[] = [styles.actionText];

    switch (action.variant) {
      case 'secondary':
        buttonStyles.push(styles.secondaryButton);
        textStyles.push(styles.secondaryText);
        break;
      case 'danger':
        buttonStyles.push(styles.dangerButton);
        textStyles.push(styles.primaryText);
        break;
      case 'ghost':
        buttonStyles.push(styles.ghostButton);
        textStyles.push(styles.ghostText);
        break;
      default:
        buttonStyles.push(styles.primaryButton);
        textStyles.push(styles.primaryText);
    }

    return (
      <TouchableOpacity
        key={`${action.label}-${index}`}
        style={buttonStyles}
        onPress={() => onActionPress(action)}
        activeOpacity={0.9}
      >
        <Text style={textStyles}>{action.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={dismissible ? onClose : undefined}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalCard}>
          <View style={[styles.iconWrapper, { backgroundColor: icon.background }]}> 
            <Ionicons name={icon.name} size={32} color={icon.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={[styles.actionsContainer, actions && actions.length > 2 && styles.actionsWrap]}>
            {actions && actions.length > 0
              ? actions.map(renderActionButton)
              : renderActionButton({ label: 'Entendi', variant: 'primary' }, 0)}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    elevation: 6,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.icon,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionsWrap: {
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryText: {
    color: COLORS.card,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  secondaryText: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: COLORS.icon,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
  },
  actionText: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
  },
});

export default FeedbackModal;
