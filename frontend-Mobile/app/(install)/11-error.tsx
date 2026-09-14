import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TriangleAlert, Radio, MapPin, Package, Battery, Zap, CheckCircle2, XCircle } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';

export default function ErrorScreen() {
  const router = useRouter();

  const handleRetry = () => {
    router.replace('/(install)/08-diagnostic');
  };

  const handleForce = () => {
    router.push('/(install)/09-preview');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBg}>
            <TriangleAlert size={40} color="#EF4444" />
          </View>
        </View>
        
        <Text style={styles.title}>Un problème a été détecté</Text>
        <Text style={styles.description}>
          Le boîtier est bien connecté mais certaines données sont manquantes.
        </Text>

        <View style={styles.card}>
          <View style={styles.checkRow}>
            <View style={styles.iconBox}><Radio size={16} color="#6B7280" /></View>
            <Text style={styles.checkLabel}>GSM</Text>
            <Text style={styles.statusOk}>Connecté</Text>
            <CheckCircle2 size={16} color="#10B981" style={{marginLeft: 8}} />
          </View>
          <View style={styles.divider} />
          <View style={styles.checkRow}>
            <View style={styles.iconBox}><MapPin size={16} color="#6B7280" /></View>
            <Text style={styles.checkLabel}>GPS</Text>
            <Text style={styles.statusOk}>Position reçue</Text>
            <CheckCircle2 size={16} color="#10B981" style={{marginLeft: 8}} />
          </View>
          <View style={styles.divider} />
          <View style={styles.checkRow}>
            <View style={styles.iconBox}><Package size={16} color="#6B7280" /></View>
            <Text style={styles.checkLabel}>Panneaux solaires</Text>
            <Text style={styles.statusError}>Aucune donnée</Text>
            <XCircle size={16} color="#EF4444" style={{marginLeft: 8}} />
          </View>
          <View style={styles.divider} />
          <View style={styles.checkRow}>
            <View style={styles.iconBox}><Battery size={16} color="#6B7280" /></View>
            <Text style={styles.checkLabel}>Batterie</Text>
            <Text style={styles.statusOk}>Données reçues</Text>
            <CheckCircle2 size={16} color="#10B981" style={{marginLeft: 8}} />
          </View>
          <View style={styles.divider} />
          <View style={styles.checkRow}>
            <View style={styles.iconBox}><Zap size={16} color="#6B7280" /></View>
            <Text style={styles.checkLabel}>Consommation AC</Text>
            <Text style={styles.statusOk}>Données reçues</Text>
            <CheckCircle2 size={16} color="#10B981" style={{marginLeft: 8}} />
          </View>
        </View>

        <View style={styles.warningAlert}>
          <TriangleAlert size={16} color="#B45309" style={{marginTop: 2}} />
          <Text style={styles.warningText}>
            Vous pouvez réessayer ou enregistrer l'installation et la configurer plus tard.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button 
          title="Réessayer" 
          onPress={handleRetry}
          style={styles.mainButton}
        />
        <Button 
          title="Enregistrer quand même" 
          variant="secondary"
          onPress={handleForce}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 24, paddingTop: 40 },
  
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 32, paddingHorizontal: 10 },
  
  card: { backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 24 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  iconBox: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkLabel: { flex: 1, fontSize: 14, color: '#4B5563', fontWeight: '500' },
  statusOk: { fontSize: 13, color: '#10B981', fontWeight: '500' },
  statusError: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  
  warningAlert: { flexDirection: 'row', backgroundColor: '#FFFBEB', padding: 16, borderRadius: 12 },
  warningText: { flex: 1, fontSize: 13, color: '#92400E', marginLeft: 12, lineHeight: 18 },
  
  footer: { padding: 24, paddingBottom: 40, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F3F4F6' },
  mainButton: { marginBottom: 16 }
});
