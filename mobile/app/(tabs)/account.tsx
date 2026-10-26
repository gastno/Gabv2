import { Button, Host } from "@expo/ui";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appointment,
  ApiError,
  getCustomerAppointments,
  hasCustomerSession,
  registerCustomer,
  signInCustomer,
  signOutCustomer,
} from "../../src/lib/api";
import { colors, spacing } from "../../src/theme";

export default function AccountScreen() {
  const [signedIn, setSignedIn] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [kennitala, setKennitala] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadAppointments = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      let sessionExists: boolean;
      try {
        sessionExists = await hasCustomerSession();
      } catch (sessionCheckError) {
        setSignedIn(false);
        setAppointments([]);
        setError(sessionCheckError instanceof Error
          ? sessionCheckError.message
          : "Could not check your account session.");
        return;
      }
      if (!sessionExists) {
        setAppointments([]);
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      try {
        setAppointments(await getCustomerAppointments());
      } catch (loadError) {
        if (loadError instanceof ApiError && loadError.status === 401) {
          let sessionError = "";
          try {
            await signOutCustomer();
          } catch (signOutError) {
            sessionError = signOutError instanceof Error ? ` ${signOutError.message}` : "";
          }
          setSignedIn(false);
          setAppointments([]);
          setError(`Your session has expired. Please sign in again.${sessionError}`);
        } else {
          setSignedIn(true);
          setAppointments([]);
          setError(loadError instanceof Error ? loadError.message : "Could not load appointments.");
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }
    if (registerMode && (!fullName.trim() || !phone.trim() || !/^\d{6}-?\d{4}$/.test(kennitala.trim()))) {
      setError("Enter your name, phone number, and a 10-digit Kennitala.");
      return;
    }
    setBusy(true);
    try {
      if (registerMode) {
        await registerCustomer({
          full_name: fullName.trim(),
          phone_number: phone.trim(),
          kennitala: kennitala.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await signInCustomer(email.trim(), password);
      }
      setPassword("");
      await loadAppointments();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setError("");
    try {
      await signOutCustomer();
      setSignedIn(false);
      setAppointments([]);
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not sign out.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.muted}>Checking your account…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (signedIn) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>YOUR GABV2</Text>
          <Text style={styles.title}>Your appointments</Text>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {appointments.length ? appointments.map((appointment) => (
            <View key={String(appointment.id)} style={styles.appointmentCard}>
              <Text style={styles.appointmentName}>{appointment.service_name}</Text>
              <Text style={styles.muted}>{appointment.brand_name} · {appointment.staff_name}</Text>
              <Text style={styles.appointmentTime}>
                {new Intl.DateTimeFormat("en-IS", {
                  timeZone: "Europe/Reykjavik",
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(appointment.start_time))}
              </Text>
              <Text style={styles.status}>{appointment.status}</Text>
            </View>
          )) : (
            <View style={styles.emptyCard}>
              <Text style={styles.appointmentName}>Nothing booked yet</Text>
              <Text style={styles.muted}>Your upcoming visits will show here after you book.</Text>
            </View>
          )}
          <Pressable accessibilityRole="button" onPress={() => void loadAppointments()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Refresh appointments</Text>
          </Pressable>
          <View style={styles.signOutButton}>
            <Host matchContents>
              <Button label="Sign out" onPress={() => void handleSignOut()} variant="text" />
            </Host>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>YOUR GABV2</Text>
          <Text style={styles.title}>{registerMode ? "Create your account" : "Welcome back"}</Text>
          <Text style={styles.muted}>
            Sign in to manage bookings, or continue as a guest when requesting an appointment.
          </Text>
          {registerMode ? (
            <>
              <Field label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
              <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Field label="Kennitala (10 digits)" value={kennitala} onChangeText={setKennitala} keyboardType="numeric" />
            </>
          ) : null}
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={styles.submitButton}>
            <Host matchContents>
              <Button
                label={busy ? "Please wait…" : registerMode ? "Create account" : "Sign in"}
                onPress={() => void handleSubmit()}
                disabled={busy}
                variant="filled"
              />
            </Host>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setRegisterMode((current) => !current)} style={styles.modeSwitch}>
            <Text style={styles.modeSwitchText}>
              {registerMode ? "Already have an account? Sign in" : "New to Gabv2? Create an account"}
            </Text>
          </Pressable>
          <Text style={styles.privacyNote}>
            Guest bookings and account registrations are validated by the Gabv2 server. Never share your password or Kennitala in support messages.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoComplete?: "name";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={label}
        placeholderTextColor={colors.muted}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  centerState: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.md },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: "700", letterSpacing: 1.4, marginTop: spacing.sm },
  title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: "700" },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  field: { gap: 6 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 13, fontSize: 16 },
  submitButton: { alignSelf: "flex-start", marginTop: spacing.sm },
  modeSwitch: { alignSelf: "flex-start", paddingVertical: spacing.md },
  modeSwitchText: { color: colors.accent, fontWeight: "700" },
  privacyNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
  error: { color: colors.error, fontSize: 14 },
  appointmentCard: { backgroundColor: colors.surface, borderRadius: 18, borderColor: colors.border, borderWidth: 1, padding: spacing.md, gap: 5 },
  appointmentName: { color: colors.ink, fontSize: 17, fontWeight: "700" },
  appointmentTime: { color: colors.ink, fontSize: 14, fontWeight: "600", marginTop: 4 },
  status: { color: colors.accent, fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, borderColor: colors.border, borderWidth: 1, padding: spacing.md, gap: 6 },
  secondaryButton: { alignSelf: "flex-start", backgroundColor: colors.ink, borderRadius: 18, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  secondaryButtonText: { color: colors.surface, fontWeight: "700" },
  signOutButton: { alignSelf: "flex-start", marginTop: spacing.sm },
});
