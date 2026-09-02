// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '@cometchat/chat-uikit-react-native';
import { useAuth } from '../../navigation/AuthContext';

type SignInNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

const SignIn = () => {
  const navigation = useNavigation<SignInNavigationProp>();
  const theme = useTheme();
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      await signIn(username.trim(), password);
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [username, password, signIn]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.color.background1 as string },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: theme.color.primary as string }]}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
          <Text style={[styles.logoText, { color: theme.color.textPrimary as string }]}>
            Veill
          </Text>
          <Text style={[styles.subtitle, { color: theme.color.textSecondary as string }]}>
            Sign in to continue
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.color.textSecondary as string }]}>
              Username
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.color.background2 as string,
                  borderColor: theme.color.borderDefault as string,
                  color: theme.color.textPrimary as string,
                },
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={theme.color.textSecondary as string}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.color.textSecondary as string }]}>
              Password
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.color.background2 as string,
                  borderColor: theme.color.borderDefault as string,
                  color: theme.color.textPrimary as string,
                },
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={theme.color.textSecondary as string}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.color.primary as string },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.color.textSecondary as string }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={[styles.footerLink, { color: theme.color.primary as string }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignIn;
