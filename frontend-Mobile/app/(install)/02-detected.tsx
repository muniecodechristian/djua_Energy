import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '../../components/ui/Button';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useInstallStore } from '../../store/useInstallStore';

export default function DetectedScreen() {
  const router = useRouter();
  const setBoxId = useInstallStore(state => state.setBoxId);
  const mockBoxId = 'DJB-00482';

  useEffect(() => {
    setBoxId(mockBoxId);
  }, []);

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={2} totalSteps={11} />

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {/* Mock Box Image */}
          <View style={styles.boxPlaceholder}>

          </View>
        </View>

        <Text style={styles.title}>Boîtier détecté</Text>
        <Text style={styles.deviceId}>{mockBoxId}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Modèle</Text>
            <Text style={styles.infoValue}>Djua Box v1</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statut</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Non associé</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Continuer"
          onPress={() => router.push('/(install)/03-source')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  imageContainer: {
    marginTop: 20,
    marginBottom: 40,
    position: 'relative',
  },
  boxPlaceholder: {
    width: 200,
    height: 140,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBadge: {
    position: 'absolute',
    bottom: -15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  deviceId: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 40,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  }
});
