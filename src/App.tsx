import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HidProvider } from './bluetooth/HidProvider';
import { LayoutsProvider } from './layouts/LayoutsProvider';
import { RootNavigator } from './navigation/RootNavigator';
import { SettingsProvider } from './settings/SettingsProvider';
import { ThemeProvider } from './themes/ThemeProvider';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <SettingsProvider>
        <ThemeProvider>
          <LayoutsProvider>
            <HidProvider>
              <RootNavigator />
            </HidProvider>
          </LayoutsProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

export default App;
