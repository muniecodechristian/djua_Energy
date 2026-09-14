import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Edit2 } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useInstallStore } from '../../store/useInstallStore';

export default function PreviewScreen() {
  const router = useRouter();
  const { quoteData, quoteId, manualData, hasQuote, location } = useInstallStore();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = () => {
    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);
      router.push('/(install)/10-success');
    }, 1500);
  };

  const getSystemInfo = () => {
    if (hasQuote && quoteData) return quoteData.system;
    return manualData || { panels: 0, panelPower: 0, batteryCapacity: 0, inverterPower: 0, expectedLoad: 0 };
  };

  const sys = getSystemInfo();
  const isQuote = hasQuote && quoteData;

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={9} totalSteps={11} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Aperçu de l'installation</Text>
        <Text style={styles.description}>Vérifiez les informations avant d'enregistrer.</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(install)/03-source')}>
            <Edit2 size={12} color="#6B7280" />
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.label}>Nom</Text><Text style={styles.value}>{isQuote ? `Maison de ${quoteData.client}` : 'Installation manuelle'}</Text></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.label}>Client</Text><Text style={styles.value}>{isQuote ? quoteData.client : 'Non renseigné'}</Text></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.label}>Type</Text><Text style={styles.value}>{isQuote ? 'Maison individuelle' : 'Autre'}</Text></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.label}>Localisation</Text><Text style={styles.value}>{location?.name || 'Inconnue'}</Text></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.label}>Source</Text><Text style={styles.value}>{isQuote ? `Devis Djua (${quoteId})` : 'Saisie manuelle'}</Text></View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Système installé</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push(hasQuote ? '/(install)/05-verify' : '/(install)/06-manual')}>
            <Edit2 size={12} color="#6B7280" />
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.label}>Panneaux</Text><Text style={styles.value}>{sys.panels} × {sys.panelPower} W ({(sys.panels * sys.panelPower / 1000).toFixed(1)} kW)</Text></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.label}>Batterie</Text><Text style={styles.value}>{sys.batteryCapacity} kWh</Text></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.label}>Onduleur</Text><Text style={styles.value}>{sys.inverterPower} kVA</Text></View>
          {sys.expectedLoad ? (
            <>
              <View style={styles.divider} />
              <View style={styles.row}><Text style={styles.label}>Charge prévue</Text><Text style={styles.value}>{sys.expectedLoad} kW</Text></View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Enregistrer l'installation" 
          onPress={handleRegister}
          isLoading={isRegistering}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  description: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  editButtonText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  
  card: { backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 14, color: '#6B7280', flex: 1 },
  value: { fontSize: 14, fontWeight: '500', color: '#111827', flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  
  footer: { padding: 24, paddingBottom: 40, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F3F4F6' }
});
