import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, PencilLine, ChevronRight } from 'lucide-react-native';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useInstallStore } from '../../store/useInstallStore';

export default function SourceScreen() {
  const router = useRouter();
  const setHasQuote = useInstallStore(state => state.setHasQuote);

  const handleSelect = (hasQuote: boolean) => {
    setHasQuote(hasQuote);
    if (hasQuote) {
      router.push('/(install)/04-search');
    } else {
      router.push('/(install)/06-manual');
    }
  };

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={3} totalSteps={11} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Associer l'installation</Text>
        <Text style={styles.description}>
          Ce boîtier sera associé à une installation. Le devis de cette installation a-t-il été créé dans Djua ?
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.optionCard, styles.optionCardActive]}
            activeOpacity={0.7}
            onPress={() => handleSelect(true)}
          >
            <View style={styles.optionIconContainerActive}>
              <FileText size={24} color="#FF5C00" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitleActive}>Oui, j'ai un numéro de devis</Text>
              <Text style={styles.optionDescription}>
                Retrouver un devis existant et préremplir les informations.
              </Text>
            </View>
            <ChevronRight size={20} color="#FF5C00" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            activeOpacity={0.7}
            onPress={() => handleSelect(false)}
          >
            <View style={styles.optionIconContainer}>
              <PencilLine size={24} color="#6B7280" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Non, enregistrer le kit manuellement</Text>
              <Text style={styles.optionDescription}>
                Renseigner les informations du système installé.
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionCardActive: {
    borderColor: '#FF5C00',
    backgroundColor: '#FFF7F0',
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconContainerActive: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionTitleActive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF5C00',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  }
});
