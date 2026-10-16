import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text, TextField } from '@/components/ui';
import { confirmEmail, isValidEmail, linkEmail, MIN_PASSWORD_LENGTH, setPassword } from '@/features/auth/accountApi';
import { useAuth } from '@/features/auth/AuthProvider';
import { setUsername } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { isValidUsername, normalizeUsername, USERNAME_MAX, USERNAME_MIN } from '@/features/friends/username';
import { PAGE_GUTTER, radii, spacing, useColors } from '@/theme';

type Step = 'email' | 'code' | 'details';

const steps: Step[] = ['email', 'code', 'details'];

// Turns the anonymous account into one friends can find, keeping every cat.
// An account that already confirmed its email but left before choosing a
// username starts at the last step.
export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, permanent } = useAuth();
  const { refresh } = useFriends();
  const [step, setStep] = useState<Step>(permanent ? 'details' : 'email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPasswordValue] = useState('');
  const [username, setUsernameValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (task: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    const failure = await task().catch(() => 'Something went wrong. Please try again.');
    setBusy(false);
    if (failure) {
      setError(failure);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const sendCode = () =>
    run(async () => {
      if (!isValidEmail(email)) return 'That email address doesn’t look right.';
      const result = await linkEmail(email);
      if (!result.ok) return result.message;
      setStep(result.confirmed ? 'details' : 'code');
      return null;
    });

  const checkCode = () =>
    run(async () => {
      const result = await confirmEmail(email, code);
      if (!result.ok) return result.message;
      setStep('details');
      return null;
    });

  const finish = () =>
    run(async () => {
      const name = normalizeUsername(username);
      if (!isValidUsername(name)) {
        return `Usernames are ${USERNAME_MIN}–${USERNAME_MAX} letters, numbers or underscores.`;
      }
      if (password.length < MIN_PASSWORD_LENGTH)
        return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
      const saved = await setPassword(password);
      if (!saved.ok) return saved.message;
      if (!session || !(await setUsername(session.user.id, name))) return `@${name} is taken. Try another.`;
      await refresh();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      return null;
    });

  const index = steps.indexOf(step);
  const copy: Record<Step, { icon: 'envelope.fill' | 'number' | 'person.fill'; title: string; body: string }> = {
    email: {
      icon: 'envelope.fill',
      title: 'Add your email',
      body: 'Your cats stay with you. An account lets friends find you and keeps your album safe.',
    },
    code: {
      icon: 'number',
      title: 'Check your inbox',
      body: `We sent a six-digit code to ${email.trim()}.`,
    },
    details: {
      icon: 'person.fill',
      title: 'Pick a username',
      body: 'This is how friends find you. You can’t change it later, so choose one you like.',
    },
  };
  const { icon, title, body } = copy[step];

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View style={styles.dots} accessibilityLabel={`Step ${index + 1} of ${steps.length}`}>
          {steps.map((s, i) => (
            <View
              key={s}
              style={[
                styles.dot,
                { backgroundColor: i <= index ? colors.accent : colors.surfacePressed },
                i === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.intro}>
          <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
            <Icon name={icon} size={26} color="accent" />
          </View>
          <Text variant="largeTitle" align="center">
            {title}
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            {body}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'email' ? (
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoFocus
              returnKeyType="next"
              onSubmitEditing={sendCode}
              error={error}
            />
          ) : step === 'code' ? (
            <TextField
              label="Code"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoFocus
              style={styles.code}
              error={error}
            />
          ) : (
            <>
              <TextField
                label="Username"
                prefix="@"
                value={username}
                onChangeText={(value) => setUsernameValue(normalizeUsername(value))}
                placeholder="catspotter"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username-new"
                textContentType="username"
                maxLength={USERNAME_MAX}
                autoFocus
              />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPasswordValue}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                secureTextEntry
                autoComplete="password-new"
                textContentType="newPassword"
                error={error}
              />
            </>
          )}
        </View>

        <View style={styles.actions}>
          {step === 'email' ? (
            <Button label="Send Code" loading={busy} disabled={!email.trim()} onPress={sendCode} />
          ) : step === 'code' ? (
            <>
              <Button label="Confirm" loading={busy} disabled={code.length !== 6} onPress={checkCode} />
              <Button label="Send a New Code" variant="plain" disabled={busy} onPress={sendCode} />
            </>
          ) : (
            <Button label="Create Account" loading={busy} disabled={!username || !password} onPress={finish} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: spacing.lg,
    gap: spacing.xxl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
  },
  intro: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.lg,
  },
  code: {
    fontSize: 24,
    letterSpacing: 8,
  },
  actions: {
    gap: spacing.xs,
  },
});
