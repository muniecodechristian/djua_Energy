import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';

// Mock Camera View for now (since running on emulator might be tricky)
export default function ScanScreen() {
  const router = useRouter();

  const handleManualEntry = () => {
    // Navigate to next screen with a mock ID
    router.push('/(install)/02-detected');
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraFrame}>
        {/* Mock QR overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
      </View>
      
      <View style={styles.bottomContainer}>
        <Text style={styles.instructionTitle}>Scannez le QR code du boîtier</Text>
        <Text style={styles.instructionText}>
          Le code sera automatiquement détecté.
        </Text>
        
        <Button 
          title="Saisir l'identifiant manuellement" 
          variant="secondary"
          onPress={handleManualEntry}
          style={styles.manualButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333', // Mock background
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  manualButton: {
    width: '100%',
  }
});
