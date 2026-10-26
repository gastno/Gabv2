import { Button, Checkbox, Host } from "@expo/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AvailabilitySlot,
  createAppointment,
  formatStudioSlot,
  getAvailability,
  getServices,
  getStudioDateKey,
  Service,
} from "../src/lib/api";
import { colors, spacing } from "../src/theme";

const CUSTOMER_TOKEN_KEY = "customer_auth_token";

type GuestDetails = {
  fullName: string;
  email: string;
  phoneNumber: string;
  kennitala: string;
};

const EMPTY_GUEST: GuestDetails = { fullName: "", email: "", phoneNumber: "", kennitala: "" };

function dateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IS", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function guestError(guest: GuestDetails): string {
  if (!guest.fullName.trim() || !guest.phoneNumber.trim()) {
    return "Enter your name and phone number.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) {
    return "Enter a valid email address.";
  }
  if (!/^\d{6}-?\d{4}$/.test(guest.kennitala.trim())) {
    return "Kennitala must contain 10 digits.";
  }
  return "";
}

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(() => getStudioDateKey(new Date(), 1));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [guest, setGuest] = useState(EMPTY_GUEST);
  const [isCustomer, setIsCustomer] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [cancellationConsent, setCancellationConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => getStudioDateKey(new Date(), index + 1)),
    []
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      getServices(),
      SecureStore.getItemAsync(CUSTOMER_TOKEN_KEY),
    ]).then(([catalog, token]) => {
      if (!active) return;
      const selected = catalog.find((item) => String(item.id) === String(serviceId));
      if (!selected) {
        setError("This service is no longer available. Return to Explore and choose another.");
      }
      setService(selected || null);
      setIsCustomer(Boolean(token));
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Could not load this service.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [serviceId]);

  useEffect(() => {
    if (!service) return undefined;
    let active = true;
    setLoadingSlots(true);
    setError("");
    setSelectedSlot(null);
    getAvailability(String(service.id), date).then((availability) => {
      if (active) setSlots(availability.slots);
    }).catch((loadError: unknown) => {
      if (active) {
        setSlots([]);
        setError(loadError instanceof Error ? loadError.message : "Could not load available times.");
      }
    }).finally(() => {
      if (active) setLoadingSlots(false);
    });
    return () => { active = false; };
  }, [date, service]);

  const submitBooking = useCallback(async () => {
    if (!service || !selectedSlot) {
      setError("Choose an available time before continuing.");
      return;
    }
    if (!privacyConsent || !cancellationConsent) {
      setError("Accept the privacy and cancellation terms to request this booking.");
      return;
    }
    if (!isCustomer) {
      const validationMessage = guestError(guest);
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
    }

    setSubmitting(true);
    setError("");
    try {
      const booking: Record<string, unknown> = {
        brand_id: service.brand_id,
        service_id: service.id,
        staff_id: selectedSlot.staff_id,
        start_time: selectedSlot.start_time,
        consent_privacy: true,
        custom_options: { cancellation_policy_accepted: true },
      };
      if (!isCustomer) {
        booking.full_name = guest.fullName.trim();
        booking.email = guest.email.trim();
        booking.phone_number = guest.phoneNumber.trim();
        booking.kennitala = guest.kennitala.trim();
      }
      const result = await createAppointment(booking);
      setSuccess(`Booking request #${result.appointment.id} sent to ${service.brand}.`);
      setSelectedSlot(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit this booking.");
    } finally {
      setSubmitting(false);
    }
  }, [cancellationConsent, guest, isCustomer, privacyConsent, selectedSlot, service]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.muted}>Loading service…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <View style={styles.centerState}>
          <Text style={styles.successMark}>✓</Text>
          <Text style={styles.title}>Request received</Text>
          <Text style={styles.muted}>{success}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace("/(tabs)")} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back to studios</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {service ? (
            <>
              <View style={styles.serviceSummary}>
                <Text style={styles.eyebrow}>{service.brand.toUpperCase()}</Text>
                <Text style={styles.serviceSummaryTitle}>{service.name_en || service.name}</Text>
                <Text style={styles.serviceSummaryMuted}>{service.duration_minutes} minutes · Reykjavík</Text>
              </View>
              <Text style={styles.sectionTitle}>Pick a day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
                {dates.map((dateKey) => {
                  const selected = dateKey === date;
                  return (
                    <Pressable
                      key={dateKey}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setDate(dateKey)}
                      style={[styles.dateChip, selected && styles.selectedDateChip]}
                    >
                      <Text style={[styles.dateText, selected && styles.selectedDateText]}>
                        {dateLabel(dateKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.sectionTitle}>Available times</Text>
              {loadingSlots ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.muted}>Checking the studio calendar…</Text>
                </View>
              ) : slots.length ? (
                <View style={styles.slotList}>
                  {slots.map((slot) => {
                    const selected = selectedSlot?.start_time === slot.start_time
                      && String(selectedSlot.staff_id) === String(slot.staff_id);
                    return (
                      <Pressable
                        key={`${slot.staff_id}-${slot.start_time}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setSelectedSlot(slot)}
                        style={[styles.slotCard, selected && styles.selectedSlotCard]}
                      >
                        <Text style={styles.slotTime}>{formatStudioSlot(slot.start_time)}</Text>
                        <Text style={styles.slotStaff}>{slot.staff_name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.muted}>No times are available on this day. Try another date.</Text>
              )}

              <Text style={[styles.sectionTitle, styles.detailsTitle]}>Your details</Text>
              {isCustomer ? (
                <View style={styles.signedInCard}>
                  <Text style={styles.signedInTitle}>Booking as a customer</Text>
                  <Text style={styles.muted}>Your saved customer account will be used.</Text>
                </View>
              ) : (
                <View style={styles.form}>
                  <Field label="Full name" value={guest.fullName} onChangeText={(fullName) => setGuest((current) => ({ ...current, fullName }))} autoComplete="name" />
                  <Field label="Email" value={guest.email} onChangeText={(email) => setGuest((current) => ({ ...current, email }))} keyboardType="email-address" autoCapitalize="none" />
                  <Field label="Phone number" value={guest.phoneNumber} onChangeText={(phoneNumber) => setGuest((current) => ({ ...current, phoneNumber }))} keyboardType="phone-pad" />
                  <Field label="Kennitala (10 digits)" value={guest.kennitala} onChangeText={(kennitala) => setGuest((current) => ({ ...current, kennitala }))} keyboardType="numeric" />
                </View>
              )}
              <View style={styles.consentCard}>
                <Host matchContents>
                  <Checkbox
                    label="I consent to the privacy policy and processing needed for this booking."
                    value={privacyConsent}
                    onValueChange={setPrivacyConsent}
                    testID="privacy-consent"
                  />
                </Host>
                <Host matchContents>
                  <Checkbox
                    label="I accept the studio cancellation policy."
                    value={cancellationConsent}
                    onValueChange={setCancellationConsent}
                    testID="cancellation-consent"
                  />
                </Host>
              </View>
              {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
              <View style={styles.submitButton}>
                <Host matchContents>
                  <Button
                    label={submitting ? "Sending request…" : "Request this booking"}
                    onPress={() => void submitBooking()}
                    disabled={submitting || loadingSlots || !selectedSlot}
                    variant="filled"
                    testID="submit-booking"
                  />
                </Host>
              </View>
              <Text style={styles.disclaimer}>
                Your time is rechecked by the studio when your request is submitted. The server confirms the final price and availability.
              </Text>
            </>
          ) : (
            <View style={styles.centerState}>
              <Text style={styles.errorText}>{error || "Service not found."}</Text>
              <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Return to Explore</Text>
              </Pressable>
            </View>
          )}
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
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  centerState: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center", gap: spacing.md },
  serviceSummary: { backgroundColor: colors.ink, borderRadius: 22, padding: spacing.lg, marginBottom: spacing.lg },
  eyebrow: { color: "#E5BDB0", fontSize: 11, letterSpacing: 1.3, fontWeight: "700" },
  title: { color: colors.ink, fontSize: 25, fontWeight: "700", marginVertical: spacing.sm },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  serviceSummaryTitle: { color: colors.surface, fontSize: 25, fontWeight: "700", marginVertical: spacing.sm },
  serviceSummaryMuted: { color: "#E6DCD6", fontSize: 14, lineHeight: 21 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: spacing.sm },
  dateRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  dateChip: { borderRadius: 18, paddingHorizontal: spacing.md, paddingVertical: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  selectedDateChip: { backgroundColor: colors.ink, borderColor: colors.ink },
  dateText: { color: colors.ink, fontWeight: "600" },
  selectedDateText: { color: colors.surface },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  slotList: { gap: spacing.sm },
  slotCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: spacing.md },
  selectedSlotCard: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  slotTime: { color: colors.ink, fontSize: 17, fontWeight: "700" },
  slotStaff: { color: colors.muted, fontSize: 14 },
  detailsTitle: { marginTop: spacing.lg },
  form: { gap: spacing.sm },
  field: { gap: 6 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 13, fontSize: 16 },
  signedInCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: spacing.md, gap: 4 },
  signedInTitle: { color: colors.ink, fontWeight: "700" },
  consentCard: { gap: spacing.md, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginTop: spacing.lg },
  errorText: { color: colors.error, fontSize: 14, lineHeight: 20, marginTop: spacing.md },
  submitButton: { alignSelf: "flex-start", marginTop: spacing.lg },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
  successMark: { color: colors.success, fontSize: 46, fontWeight: "700" },
  secondaryButton: { backgroundColor: colors.ink, borderRadius: 18, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  secondaryButtonText: { color: colors.surface, fontWeight: "700" },
});
