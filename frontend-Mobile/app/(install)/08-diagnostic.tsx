import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Radio, MapPin, Package, Battery, Zap, CheckCircle2, XCircle } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { StepIndicator } from '../../components/ui/StepIndicator';

const MOCK_CHECKS = [
  { id: 'gsm', label: 'Communication GSM', icon: Radio, delay: 500 },
  { id: 'gps', label: 'GPS', icon: MapPin, delay: 1000 },
  { id: 'panels', label: 'Panneaux solaires', icon: Package, delay: 1500 },
  { id: 'battery', label: 'Batterie', icon: Battery, delay: 2000 },
  { id: 'load', label: 'Consommation AC', icon: Zap, delay: 2500 },
];

export default function DiagnosticScreen() {
  const router = useRouter();
  const [completedChecks, setCompletedChecks] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    MOCK_CHECKS.forEach(check => {
      setTimeout(() => {
        setCompletedChecks(prev => [...prev, check.id]);
      }, check.delay);
    });

    setTimeout(() => {
      setIsChecking(false);
    }, MOCK_CHECKS[MOCK_CHECKS.length - 1].delay + 500);
  }, []);

  const handleContinue = () => {
    // We assume success here (screen 9). To see error, we could branch to 11.
    router.push('/(install)/09-preview');
  };

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={8} totalSteps={11} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Vérification du boîtier</Text>
        <Text style={styles.description}>
          Nous vérifions que Djua reçoit correctement les données du boîtier.
        </Text>

        <View style={styles.card}>
          {MOCK_CHECKS.map((check, index) => {
            const Icon = check.icon;
            const isDone = completedChecks.includes(check.id);
            const isLast = index === MOCK_CHECKS.length - 1;

            return (
              <View key={check.id} style={[styles.checkRow, !isLast && styles.borderBottom]}>
                <View style={styles.checkIconBox}>
                  <Icon size={20} color="#4B5563" />
                </View>
                <Text style={styles.checkLabel}>{check.label}</Text>
                
                <View style={styles.statusContainer}>
                  {isDone ? (
                    <>
                      <Text style={styles.statusTextDone}>{check.id === 'gsm' ? 'Connecté' : check.id === 'gps' ? 'Position reçue' : 'Données reçues'}</Text>
                      <CheckCircle2 size={20} color="#10B981" />
                    </>
                  ) : (
                    <>
                      <Text style={styles.statusTextPending}>Vérification...</Text>
                      <View style={styles.dotPulse} />
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <Button 
          title="Voir les mesures en direct" 
          variant="secondary"
          style={styles.liveButton}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Continuer" 
          onPress={handleContinue}
          disabled={isChecking}
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
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 24,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  checkIconBox: {
    width: 32, height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
    marginRight: 12,
  },
  checkLabel: { fontSize: 15, fontWeight: '500', color: '#111827', flex: 1 },
  
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusTextDone: { fontSize: 14, color: '#10B981', fontWeight: '500' },
  statusTextPending: { fontSize: 14, color: '#6B7280' },
  dotPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5C00' }, // mock pulse
  
  liveButton: { backgroundColor: '#F3F4F6' },
  
  footer: { padding: 24, paddingBottom: 40, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F3F4F6' }
});
