import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapPin } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useInstallStore } from '../../store/useInstallStore';

export default function LocationScreen() {
  const router = useRouter();
  const setLocation = useInstallStore(state => state.setLocation);
  const [isLocating, setIsLocating] = useState(true);

  const initialRegion = {
    latitude: -4.3224, // Kinshasa approximate
    longitude: 15.3070,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    // Simulate GPS location fetching
    setTimeout(() => {
      setIsLocating(false);
    }, 1500);
  }, []);

  const handleConfirm = () => {
    setLocation({
      latitude: initialRegion.latitude,
      longitude: initialRegion.longitude,
      name: 'Gombe, Kinshasa',
      accuracy: 12,
    });
    router.push('/(install)/08-diagnostic');
  };

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={7} totalSteps={11} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Position de l'installation</Text>
        <Text style={styles.description}>
          La position de l'installation est utilisée pour détecter un éventuel déplacement du système.
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView 
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={initialRegion}
        >
          {!isLocating && (
            <Marker coordinate={{ latitude: initialRegion.latitude, longitude: initialRegion.longitude }} />
          )}
        </MapView>
        
        {/* Overlay Card */}
        <View style={styles.overlayCard}>
          <View style={styles.locationInfo}>
            <View style={styles.iconBox}>
              <MapPin size={24} color="#111827" />
            </View>
            <View style={styles.textInfo}>
              <Text style={styles.locationName}>Gombe, Kinshasa</Text>
              <Text style={styles.accuracyText}>
                Précision : <Text style={styles.accuracyValue}>± 12 m</Text>
              </Text>
            </View>
            <Button 
              title="Modifier" 
              variant="secondary" 
              style={styles.editButton} 
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button 
          title="Confirmer cette position" 
          onPress={handleConfirm}
          isLoading={isLocating}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 12 },
  description: { fontSize: 15, color: '#6B7280', lineHeight: 22 },
  
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayCard: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  textInfo: { flex: 1 },
  locationName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  accuracyText: { fontSize: 13, color: '#6B7280' },
  accuracyValue: { fontWeight: '600', color: '#374151' },
  editButton: { height: 36, paddingHorizontal: 12 },
  
  footer: { padding: 24, paddingBottom: 40, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F3F4F6' }
});
