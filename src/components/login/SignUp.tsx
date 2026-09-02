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

type SignUpNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

const SignUp = () => {
  const navigation = useNavigation<SignUpNavigationProp>();
  const theme = useTheme();
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Username and password are required');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(username.trim(), displayName.trim() || username.trim(), password);
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [username, displayName, password, confirmPassword, signUp]);

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
            Create your account
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
              placeholder="Choose a username"
              placeholderTextColor={theme.color.textSecondary as string}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.color.textSecondary as string }]}>
              Display Name
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
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={theme.color.textSecondary as string}
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
              placeholder="Create a password"
              placeholderTextColor={theme.color.textSecondary as string}
              secureTextEntry
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.color.textSecondary as string }]}>
              Confirm Password
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
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor={theme.color.textSecondary as string}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.color.primary as string },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.color.textSecondary as string }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={[styles.footerLink, { color: theme.color.primary as string }]}>
                Sign In
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

export default SignUp;
