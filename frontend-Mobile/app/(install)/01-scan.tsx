import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, Dimensions, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { X, Zap, ZapOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.68;

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const isNavigating = useRef(false);

  const insets = useSafeAreaInsets();

  const handleBarcodeScanned = (scanningResult: BarcodeScanningResult) => {
    if (scanned || isNavigating.current) return;

    setScanned(true);
    isNavigating.current = true;

    router.push({
      pathname: '/(install)/02-detected',
      params: { code: scanningResult.data },
    });
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
        <TouchableOpacity style={styles.manualButton} onPress={requestPermission}>
          <Text style={styles.manualButtonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Caméra en arrière-plan */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* 2. Bouton Fermer (Haut Gauche) */}
      <View style={[styles.headerContainer, { top: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 3. Zone Centrale (Cadre QR + Torche + Textes) */}
      <View style={styles.centerContainer}>
        {/* Cadre de visée */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Bouton Lampe Torche */}
        <TouchableOpacity
          style={styles.torchButton}
          onPress={() => setTorch(!torch)}
          activeOpacity={0.75}
        >
          {torch ? (
            <ZapOff size={22} color="#FFFFFF" />
          ) : (
            <Zap size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* Consignes */}
        <Text style={styles.instructionTitle}>Scannez le QR code du boîtier</Text>
        <Text style={styles.instructionText}>Le code sera automatiquement détecté.</Text>
      </View>

      {/* 4. Bouton Saisie Manuelle (Bas) */}
      <View style={[styles.bottomContainer, { bottom: Math.max(insets.bottom + 12, 24) }]}>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => router.push('/(install)/02-detected')}
          activeOpacity={0.85}
        >
          <Text style={styles.manualButtonText}>Saisir l'identifiant manuellement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CORNER_LENGTH = 36;
const CORNER_WIDTH = 4;
const CORNER_RADIUS = 16;
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // -- HEADER --
  headerContainer: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // -- ZONE CENTRALE ANCRÉE ABSOLUE --
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 110,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    position: 'relative',
    marginBottom: 32,
  },
  corner: {
    position: 'absolute',
    width: CORNER_LENGTH,
    height: CORNER_LENGTH,
    borderColor: WHITE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: CORNER_RADIUS,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: CORNER_RADIUS,
  },

  // -- BOUTON TORCHE --
  torchButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  // -- TEXTES --
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 6,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
  },

  // -- BOUTON BAS --
  bottomContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 20,
  },
  manualButton: {
    backgroundColor: 'rgba(241, 245, 249, 0.92)',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  manualButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },

  // -- PERMISSION --
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 24,
    textAlign: 'center',
  },
});