// React 19 compat: MUST be first import — patches ReactSharedInternals before
// @shopify/react-native-skia's react-reconciler@0.27.x loads.
import './src/compat/react19Shim';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
