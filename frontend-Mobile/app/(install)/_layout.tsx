import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, X } from 'lucide-react-native';

export default function InstallLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '600',
        },



        contentStyle: {
          backgroundColor: '#FFFFFF',
        }
      }}
    >
      <Stack.Screen
        name="01-scan"
        options={{
          headerShown: false,
          title: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace('/')}
              style={[styles.headerButton, styles.darkButton]}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ),
          headerRight: () => null,
        }}
      />
      <Stack.Screen name="02-detected" options={{ headerShown: false, title: 'Boîtier détecté' }} />
      <Stack.Screen name="03-source" options={{ headerShown: false, title: 'Associer l\'installation' }} />
      <Stack.Screen name="04-search" options={{ headerShown: false, title: 'Rechercher un devis' }} />
      <Stack.Screen name="05-verify" options={{ headerShown: false, title: 'Vérifier le système installé' }} />
      <Stack.Screen name="06-manual" options={{ headerShown: false, title: 'Informations du système' }} />
      <Stack.Screen name="07-location" options={{ headerShown: false, title: 'Position de l\'installation' }} />
      <Stack.Screen name="08-diagnostic" options={{ headerShown: false, title: 'Vérification du boîtier' }} />
      <Stack.Screen name="09-preview" options={{ headerShown: false, title: 'Aperçu de l\'installation' }} />
      <Stack.Screen name="10-success" options={{ headerShown: false, title: 'Installation connectée', headerLeft: () => null, headerRight: () => null }} />
      <Stack.Screen name="11-error" options={{ headerShown: false, title: 'Un problème a été détecté' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: 8,
    marginLeft: -8,
  },
  darkButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    marginLeft: 8,
  }
});