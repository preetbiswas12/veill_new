import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

interface PendingNavigation {
  name: keyof RootStackParamList;
  params?: any;
}

let pendingNavigation: PendingNavigation | null = null;

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName] extends undefined
    ? undefined
    : RootStackParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  } else {
    pendingNavigation = { name, params };
  }
}

export function processPendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    const { name, params } = pendingNavigation;
    navigationRef.navigate(name as any, params as any);
    pendingNavigation = null;
  }
}
