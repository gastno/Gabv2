import { Button, Host } from "@expo/ui";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand, getAssetUrl, getBrands, getServices, Service } from "../../src/lib/api";
import { colors, spacing } from "../../src/theme";

function formatPrice(service: Service) {
  const price = service.sale_price_isk ?? service.price_isk;
  return `${Math.round(Number(price)).toLocaleString("is-IS")} kr`;
}

function ServiceCard({ service, onBook }: { service: Service; onBook: (service: Service) => void }) {
  const imageUri = getAssetUrl(service.image_url);
  return (
    <View style={styles.serviceCard}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} contentFit="cover" style={styles.serviceImage} />
      ) : (
        <View style={[styles.serviceImage, styles.imagePlaceholder]}>
          <Text style={styles.placeholderMark}>g.</Text>
        </View>
      )}
      <View style={styles.serviceBody}>
        <Text style={styles.brandName}>{service.brand}</Text>
        <Text style={styles.serviceName}>{service.name_en || service.name}</Text>
        <Text style={styles.serviceMeta}>
          {service.duration_minutes} min <Text style={styles.metaDot}>·</Text> {formatPrice(service)}
        </Text>
        <View style={styles.bookButton}>
          <Host matchContents>
            <Button
              label="Choose a time"
              onPress={() => onBook(service)}
              variant="filled"
              testID={`book-service-${service.id}`}
            />
          </Host>
        </View>
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCatalog = useCallback(async (isRefresh = false) => {
    setError("");
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [brandList, serviceList] = await Promise.all([getBrands(), getServices()]);
      setBrands(brandList);
      setServices(serviceList);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load studios.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const visibleServices = useMemo(
    () => selectedBrand === "all"
      ? services
      : services.filter((service) => String(service.brand_id) === selectedBrand),
    [selectedBrand, services]
  );
  const handleBook = useCallback((service: Service) => {
    router.push({ pathname: "/booking", params: { serviceId: String(service.id) } });
  }, [router]);
  const renderService = useCallback(
    ({ item }: { item: Service }) => <ServiceCard service={item} onBook={handleBook} />,
    [handleBook]
  );

  const listHeader = (
    <View>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>GABBABLU · AMOR TATTOO</Text>
        <Text style={styles.title}>Make time for you.</Text>
        <Text style={styles.intro}>Thoughtful beauty and tattoo studios in Reykjavík.</Text>
      </View>
      <Text style={styles.sectionTitle}>Choose your studio</Text>
      <FlatList
        horizontal
        data={[{ id: "all", name: "All studios" }, ...brands.map((brand) => ({
          id: String(brand.id),
          name: brand.name,
        }))]}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.brandChips}
        renderItem={({ item }) => {
          const selected = selectedBrand === item.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSelectedBrand(item.id)}
              style={[styles.brandChip, selected && styles.brandChipSelected]}
            >
              <Text style={[styles.brandChipText, selected && styles.brandChipTextSelected]}>
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />
      <Text style={styles.sectionTitle}>Available services</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.stateText}>Loading studios…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && services.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Studios are unavailable</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadCatalog()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={visibleServices}
        keyExtractor={(service) => String(service.id)}
        renderItem={renderService}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <Text style={styles.stateText}>There are no services for this studio right now.</Text>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void loadCatalog(true)} />
        }
        accessibilityLabel="Studio services"
      />
      {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  eyebrow: { color: "#E5BDB0", fontSize: 11, letterSpacing: 1.4, fontWeight: "700" },
  title: { color: colors.surface, fontSize: 34, fontWeight: "700", marginTop: spacing.md },
  intro: { color: "#E8E1DD", fontSize: 15, lineHeight: 22, marginTop: spacing.sm, maxWidth: 280 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm },
  brandChips: { gap: spacing.sm, paddingBottom: spacing.lg },
  brandChip: {
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  brandChipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  brandChipText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  brandChipTextSelected: { color: colors.surface },
  serviceCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
  serviceImage: { width: 82, height: 100, borderRadius: 14, backgroundColor: colors.accentSoft },
  imagePlaceholder: { justifyContent: "center", alignItems: "center" },
  placeholderMark: { fontSize: 28, color: colors.accent, fontWeight: "700" },
  serviceBody: { flex: 1, justifyContent: "center", gap: 5 },
  brandName: { color: colors.accent, fontSize: 11, fontWeight: "700", letterSpacing: 0.7 },
  serviceName: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  serviceMeta: { color: colors.muted, fontSize: 13 },
  metaDot: { color: colors.accent },
  bookButton: { alignSelf: "flex-start", marginTop: 5 },
  centerState: { flex: 1, padding: spacing.xl, justifyContent: "center", alignItems: "center", gap: spacing.md },
  errorTitle: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  stateText: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  retryButton: { backgroundColor: colors.accent, borderRadius: 18, paddingHorizontal: spacing.lg, paddingVertical: 11 },
  retryText: { color: colors.surface, fontWeight: "700" },
  inlineError: { color: colors.error, marginHorizontal: spacing.md, marginBottom: spacing.md },
});
