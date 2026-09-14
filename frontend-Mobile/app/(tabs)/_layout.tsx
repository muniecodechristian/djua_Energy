import { SymbolView } from 'expo-symbols';
import { Link, Stack, Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';







export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Tab One',
        }}
      />
      <Stack.Screen
        name="two"
        options={{
          headerShown: false,
          title: 'Tab Two',
        }}
      />
    </Stack>
  );
}
