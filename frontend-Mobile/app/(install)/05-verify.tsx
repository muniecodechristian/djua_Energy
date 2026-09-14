import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Info, Package, Battery, Zap, Edit2 } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useInstallStore } from '../../store/useInstallStore';

export default function VerifyScreen() {
  const router = useRouter();
  const quoteData = useInstallStore(state => state.quoteData);

  if (!quoteData) {
    return (
      <View style={styles.container}>
        <Text>Aucun devis sélectionné.</Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  const { system } = quoteData;

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={5} totalSteps={11} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Vérifier le système installé</Text>
        <Text style={styles.description}>
          Les informations proviennent du devis. Confirmez qu'elles correspondent à l'installation.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}><Package size={20} color="#10B981" /></View>
            <View style={styles.cardTextContent}>
              <Text style={styles.cardTitle}>Panneaux solaires</Text>
              <Text style={styles.cardDetail}>{system.panels} × {system.panelPower} W</Text>
              <Text style={styles.cardDetail}>{(system.panels * system.panelPower / 1000).toFixed(1)} kW</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Edit2 size={14} color="#4B5563" />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}><Battery size={20} color="#10B981" /></View>
            <View style={styles.cardTextContent}>
              <Text style={styles.cardTitle}>Batterie</Text>
              <Text style={styles.cardDetail}>{system.batteryCapacity} kWh</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}><Zap size={20} color="#10B981" /></View>
            <View style={styles.cardTextContent}>
              <Text style={styles.cardTitle}>Onduleur</Text>
              <Text style={styles.cardDetail}>{system.inverterPower} kVA</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoAlert}>
          <Info size={20} color="#3B82F6" style={{marginTop: 2}} />
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>Le système installé est différent du devis ?</Text>
            <Text style={styles.alertDescription}>
              Vous pourrez ajuster les informations à l'étape suivante.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Continuer" 
          onPress={() => router.push('/(install)/07-location')} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 12 },
  description: { fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 24 },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  cardTextContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardDetail: { fontSize: 15, color: '#4B5563', marginBottom: 2 },
  
  editButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#F3F4F6', borderRadius: 20,
  },
  editButtonText: { fontSize: 13, fontWeight: '500', color: '#4B5563' },
  
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 40,
  },
  alertTextContainer: { flex: 1, marginLeft: 12 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#1E40AF', marginBottom: 4 },
  alertDescription: { fontSize: 13, color: '#1E3A8A', lineHeight: 18 },
  
  footer: { padding: 24, paddingBottom: 40, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F3F4F6' }
});
