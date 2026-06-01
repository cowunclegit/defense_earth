/**
 * React 19 compatibility shim for react-reconciler@0.27.x
 *
 * @shopify/react-native-skia@1.3.10 depends on react-reconciler@0.27.0 which was
 * built for React 18. In React 19, `ReactSharedInternals.ReactCurrentOwner` was
 * removed from the public internals object.
 *
 * This shim must be the FIRST import in the entry point (index.js) so it runs
 * before react-reconciler is loaded and reads ReactSharedInternals.
 */
import React from 'react';
import { Alert } from 'react-native';

// React 19 renamed __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
// to __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.
if (!React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED && React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) {
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
}

const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
if (internals && !internals.ReactCurrentOwner) {
  // Provide a stub { current: null } object. react-reconciler 0.27.x reads
  // this during module init and later mutates .current to the active fiber.
  // Since the same object reference is retained throughout, the mutations
  // still work correctly even with this shim.
  internals.ReactCurrentOwner = { current: null };
}

// Global Alert.alert polyfill for web environment
if (typeof window !== 'undefined') {
  Alert.alert = (title, message, buttons) => {
    const promptText = `${title}\n\n${message || ''}`;
    if (!buttons || buttons.length === 0) {
      window.alert(promptText);
      return;
    }
    if (buttons.length === 1) {
      window.alert(promptText);
      if (buttons[0].onPress) {
        buttons[0].onPress();
      }
      return;
    }
    const result = window.confirm(promptText);
    if (result) {
      const okButton = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];
      if (okButton && okButton.onPress) {
        okButton.onPress();
      }
    } else {
      const cancelButton = buttons.find(b => b.style === 'cancel') || buttons[0];
      if (cancelButton && cancelButton.onPress) {
        cancelButton.onPress();
      }
    }
  };
}

