import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useInstallStore } from '../../store/useInstallStore';

export default function ManualScreen() {
  const router = useRouter();
  const setManualData = useInstallStore(state => state.setManualData);

  const [panels, setPanels] = useState(4);
  const [panelPower, setPanelPower] = useState('600');
  const [batteryCapacity, setBatteryCapacity] = useState('5');
  const [inverterPower, setInverterPower] = useState('3');
  const [expectedLoad, setExpectedLoad] = useState('1.5');

  const handleContinue = () => {
    setManualData({
      panels,
      panelPower: parseFloat(panelPower) || 0,
      batteryCapacity: parseFloat(batteryCapacity) || 0,
      inverterPower: parseFloat(inverterPower) || 0,
      expectedLoad: parseFloat(expectedLoad) || undefined,
    });
    router.push('/(install)/07-location');
  };

  const totalPower = ((panels * (parseFloat(panelPower) || 0)) / 1000).toFixed(1);

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={6} totalSteps={11} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Informations du système</Text>
        <Text style={styles.description}>
          Renseignez les principaux composants installés.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Panneaux solaires</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Nombre de panneaux</Text>
            <View style={styles.numberControl}>
              <TouchableOpacity onPress={() => setPanels(Math.max(1, panels - 1))} style={styles.controlBtn}>
                <Text style={styles.controlText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.controlValue}>{panels}</Text>
              <TouchableOpacity onPress={() => setPanels(panels + 1)} style={styles.controlBtn}>
                <Text style={styles.controlText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Puissance d'un panneau</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input} 
                value={panelPower} 
                onChangeText={setPanelPower} 
                keyboardType="numeric"
                textAlign="right"
              />
              <Text style={styles.unit}>W</Text>
            </View>
          </View>
          
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Puissance totale</Text>
            <Text style={styles.totalValue}>{totalPower} kW</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Batterie</Text>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Capacité totale</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input} 
                value={batteryCapacity} 
                onChangeText={setBatteryCapacity} 
                keyboardType="numeric"
                textAlign="right"
              />
              <Text style={styles.unit}>kWh</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Onduleur</Text>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Puissance</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input} 
                value={inverterPower} 
                onChangeText={setInverterPower} 
                keyboardType="numeric"
                textAlign="right"
              />
              <Text style={styles.unit}>kVA</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Charge prévue (optionnel)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Puissance de charge prévue</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input} 
                value={expectedLoad} 
                onChangeText={setExpectedLoad} 
                keyboardType="numeric"
                textAlign="right"
              />
              <Text style={styles.unit}>kW</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Continuer" 
          onPress={handleContinue} 
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
  
  section: { marginBottom: 32 },
  lastSection: { marginBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: { fontSize: 15, color: '#374151', flex: 1 },
  
  numberControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  controlBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  controlText: { fontSize: 18, color: '#374151', fontWeight: '600' },
  controlValue: { fontSize: 16, fontWeight: '600', color: '#111827', minWidth: 24, textAlign: 'center' },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    width: 100,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
  unit: { fontSize: 15, color: '#6B7280', marginLeft: 8 },
  
  totalBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  totalLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  
  footer: { padding: 24, paddingBottom: 40, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F3F4F6' }
});
