import { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, BackHandler } from 'react-native';
import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
};

let resolvePromise: ((value: boolean) => void) | null = null;
let currentOptions: AlertOptions | null = null;

export const CustomAlert = () => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const show = useCallback((opts: AlertOptions): Promise<boolean> => {
    currentOptions = opts;
    setOptions(opts);
    setVisible(true);
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  }, []);

  const hide = useCallback((value = false) => {
    setVisible(false);
    setOptions(null);
    resolvePromise?.(value);
    resolvePromise = null;
    currentOptions = null;
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        hide();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [visible, hide]);

  useEffect(() => {
    (global as any).__customAlert = show;
  }, [show]);

  if (!options) return null;

  const getButtonStyle = (btnStyle?: string) => {
    if (btnStyle === 'destructive') return styles.destructiveButton;
    if (btnStyle === 'cancel') return styles.cancelButton;
    return styles.defaultButton;
  };

  const getButtonTextStyle = (btnStyle?: string) => {
    if (btnStyle === 'destructive') return styles.destructiveButtonText;
    if (btnStyle === 'cancel') return styles.cancelButtonText;
    return styles.defaultButtonText;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => hide()}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => hide()} />
        <View style={styles.container}>
          <Text style={styles.title}>{options.title}</Text>
          {options.message ? <Text style={styles.message}>{options.message}</Text> : null}
          <View style={styles.buttonContainer}>
            {options.buttons?.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.button, getButtonStyle(btn.style)]}
                onPress={() => {
                  btn.onPress?.();
                  hide(btn.style !== 'cancel');
                }}
                activeOpacity={0.7}
              >
                <Text style={getButtonTextStyle(btn.style)}>{btn.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: '80%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.heading,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  defaultButton: {
    backgroundColor: Colors.primary,
  },
  defaultButtonText: {
    color: Colors.gray,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  cancelButtonText: {
    color: Colors.gray,
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: Colors.red,
  },
  destructiveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export function showCustomAlert(options: AlertOptions): Promise<boolean> {
  const alert = (global as any).__customAlert;
  if (alert) {
    return alert(options);
  }
  return Promise.resolve(false);
}
