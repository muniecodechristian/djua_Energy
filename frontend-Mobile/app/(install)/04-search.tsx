import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, CheckCircle2, Battery, Zap, Package } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useInstallStore } from '../../store/useInstallStore';

export default function SearchScreen() {
  const router = useRouter();
  const [quoteId, setQuoteId] = useState('OE-2026-00847');
  const [isSearching, setIsSearching] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  
  const setStoreQuoteData = useInstallStore(state => state.setQuoteData);

  const mockQuoteData = {
    client: 'Jean Kabeya',
    location: 'Maison individuelle - Gombe',
    system: {
      panels: 4,
      panelPower: 600,
      batteryCapacity: 5,
      inverterPower: 3
    }
  };

  const handleSearch = () => {
    if (!quoteId.trim()) return;
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      setHasResult(true);
    }, 800);
  };

  const handleUseQuote = () => {
    setStoreQuoteData(quoteId, mockQuoteData);
    router.push('/(install)/05-verify');
  };

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={4} totalSteps={11} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Rechercher un devis</Text>
        <Text style={styles.description}>
          Entrez le numéro du devis associé à cette installation.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Numéro du devis</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={quoteId}
              onChangeText={setQuoteId}
              placeholder="Ex: OE-2026-00847"
              placeholderTextColor="#9CA3AF"
            />
            {quoteId.length > 0 && (
              <TouchableOpacity onPress={() => setQuoteId('')} style={styles.clearButton}>
                <View style={styles.clearIcon}><Text style={{color:'#fff', fontSize:10, fontWeight:'bold'}}>X</Text></View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Button 
          title="Rechercher" 
          onPress={handleSearch}
          isLoading={isSearching}
          style={styles.searchButton}
        />

        {hasResult && (
          <View style={styles.resultContainer}>
            <View style={styles.successHeader}>
              <CheckCircle2 size={20} color="#10B981" />
              <Text style={styles.successText}>Devis trouvé</Text>
            </View>

            <View style={styles.quoteCard}>
              <Text style={styles.quoteTitle}>{quoteId}</Text>
              <Text style={styles.quoteClient}>{mockQuoteData.client}</Text>
              <Text style={styles.quoteLocation}>{mockQuoteData.location}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.systemTitle}>Système prévu</Text>
              
              <View style={styles.systemRow}>
                <Package size={16} color="#6B7280" />
                <Text style={styles.systemText}>{mockQuoteData.system.panels} × panneaux {mockQuoteData.system.panelPower} W</Text>
                <Text style={styles.systemValue}>{(mockQuoteData.system.panels * mockQuoteData.system.panelPower / 1000).toFixed(1)} kW</Text>
              </View>
              
              <View style={styles.systemRow}>
                <Battery size={16} color="#6B7280" />
                <Text style={styles.systemText}>Batterie {mockQuoteData.system.batteryCapacity} kWh</Text>
              </View>
              
              <View style={styles.systemRow}>
                <Zap size={16} color="#6B7280" />
                <Text style={styles.systemText}>Onduleur {mockQuoteData.system.inverterPower} kVA</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {hasResult && (
        <View style={styles.footer}>
          <Button 
            title="Utiliser ce devis" 
            onPress={handleUseQuote} 
            style={styles.useButton}
          />
          <TouchableOpacity style={styles.wrongQuoteButton} onPress={() => setHasResult(false)}>
            <Text style={styles.wrongQuoteText}>Ce n'est pas le bon devis</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 12 },
  description: { fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    height: 52,
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  clearButton: { padding: 4 },
  clearIcon: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  searchButton: { marginBottom: 32 },
  
  resultContainer: { flex: 1 },
  successHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  successText: { fontSize: 15, fontWeight: '600', color: '#10B981' },
  quoteCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
  },
  quoteTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  quoteClient: { fontSize: 15, color: '#374151' },
  quoteLocation: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 },
  systemTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 12 },
  systemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  systemText: { fontSize: 14, color: '#4B5563', marginLeft: 12, flex: 1 },
  systemValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  
  footer: { padding: 24, paddingBottom: 40, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F3F4F6' },
  useButton: { marginBottom: 16 },
  wrongQuoteButton: { alignItems: 'center', paddingVertical: 8 },
  wrongQuoteText: { fontSize: 15, fontWeight: '500', color: '#4B5563' }
});
