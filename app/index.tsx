import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Colors from '@/constants/Colors';
import Fonts from '@/constants/Fonts';
import { Link } from 'expo-router';

const WelcomeScreen = () => {
  const openLink = () => {
    Linking.openURL('');
  };

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/goth.png')} style={styles.welcome} />
      <Text style={styles.headline}>Welcome to Veill</Text>
      <Text style={styles.description}>
        Read our{' '}
        <Text style={styles.link} onPress={openLink}>
          Privacy Policy
        </Text>
        . {'Tap "Agree & Continue" to accept the '}
        <Text style={styles.link} onPress={openLink}>
          Terms of Service
        </Text>
        .
      </Text>
      <Link href={'/auth/sign-in' as any} replace asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Agree & Continue</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  welcome: {
    width: '100%',
    height: 300,
    borderRadius: 60,
    marginBottom: 80,
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    color: Colors.text,
    fontFamily: Fonts.heading,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 80,
    color: Colors.textSecondary,
  },
  link: {
    color: Colors.text,
  },
  button: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '500',
  },
});

export default WelcomeScreen;

