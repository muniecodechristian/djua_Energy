import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, Home, Activity } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { useInstallStore } from '../../store/useInstallStore';

export default function SuccessScreen() {
  const router = useRouter();
  const { boxId, quoteData, hasQuote, location } = useInstallStore();
  
  const reset = useInstallStore(state => state.reset);

  const clientName = hasQuote && quoteData ? quoteData.client : 'Client';
  const locName = location?.name || 'Localisation non définie';

  const handleFinish = () => {
    reset();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle2 size={80} color="#10B981" />
        </View>
        
        <Text style={styles.title}>Installation connectée</Text>
        <Text style={styles.description}>
          Le boîtier {boxId} est maintenant associé à cette installation.
        </Text>

        <View style={styles.card}>
          <View style={styles.homeIconBox}>
            <Home size={24} color="#6B7280" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Maison de {clientName}</Text>
            <Text style={styles.cardSubtitle}>{locName}</Text>
          </View>
        </View>

        <View style={styles.learningCard}>
          <View style={styles.learningHeader}>
            <Activity size={16} color="#10B981" />
            <Text style={styles.learningTitle}>Apprentissage en cours</Text>
          </View>
          <Text style={styles.learningDesc}>
            Djua collecte les premières données pour établir le comportement habituel de cette installation.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button 
          title="Voir l'installation" 
          onPress={handleFinish} // Should navigate to the installation detail
          style={styles.mainButton}
        />
        <Button 
          title="Retour au parc" 
          variant="secondary"
          onPress={handleFinish}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  iconContainer: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    marginBottom: 16,
  },
  homeIconBox: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#6B7280' },
  
  learningCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  learningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  learningTitle: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  learningDesc: { fontSize: 13, color: '#064E3B', lineHeight: 18 },
  
  footer: { padding: 24, paddingBottom: 40, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F3F4F6' },
  mainButton: { marginBottom: 16 }
});
