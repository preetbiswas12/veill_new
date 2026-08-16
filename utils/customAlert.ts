import { showCustomAlert } from '@/components/CustomAlert';

export function alert(title: string, message?: string, buttons?: any[]): Promise<boolean> {
  const mappedButtons = buttons?.map((btn: any) => ({
    text: btn.text,
    onPress: btn.onPress,
    style: btn.style,
  }));

  return showCustomAlert({
    title,
    message,
    buttons: mappedButtons,
    cancelable: true,
  });
}
