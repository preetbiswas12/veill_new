import React from 'react';
import { View, Text, StyleSheet, Appearance, Button } from 'react-native';

interface State {
  hasError: boolean;
  error: Error | null;
  colorScheme: 'light' | 'dark' | null;
}

interface Props {
  children: React.ReactNode;
}

class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const colorScheme = Appearance.getColorScheme() ?? null;
    this.state = { hasError: false, error: null, colorScheme };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('ErrorBoundary caught an error', error, errorInfo);
  }

  componentDidMount() {
    Appearance.addChangeListener(({ colorScheme }) => {
      this.setState({ colorScheme: colorScheme ?? null });
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const styles = createStyles(this.state.colorScheme);
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <View style={styles.buttonContainer}>
              <Button title="Retry" onPress={this.handleRetry} color={this.state.colorScheme === 'dark' ? "#bbbbbb" : "#333333"} />
            </View>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const createStyles = (colorScheme: 'light' | 'dark' | null) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f2f2f2',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    card: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: isDark ? '#000000' : '#aaa',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      width: '100%',
      maxWidth: 400,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 12,
      color: isDark ? '#ffffff' : '#333333',
    },
    buttonContainer: {
      width: '100%',
    },
  });
};

export default AppErrorBoundary;
