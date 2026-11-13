import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ControllerScreen } from '../screens/controller/ControllerScreen';
import { LayoutEditorScreen } from '../screens/editor/LayoutEditorScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LayoutsScreen } from '../screens/layouts/LayoutsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ThemesScreen } from '../screens/themes/ThemesScreen';
import { useTheme } from '../themes/ThemeProvider';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors } = useTheme().theme;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Controller" component={ControllerScreen} />
        <Stack.Screen name="Layouts" component={LayoutsScreen} />
        <Stack.Screen name="LayoutEditor" component={LayoutEditorScreen} />
        <Stack.Screen name="Themes" component={ThemesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
