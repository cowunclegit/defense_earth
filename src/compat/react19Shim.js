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
const originalInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED || React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
if (originalInternals) {
  const stubOwner = { current: null };
  const patchedInternals = new Proxy(originalInternals, {
    get(target, prop, receiver) {
      if (prop === 'ReactCurrentOwner') {
        return stubOwner;
      }
      return Reflect.get(target, prop, receiver);
    },
    has(target, prop) {
      if (prop === 'ReactCurrentOwner') {
        return true;
      }
      return Reflect.has(target, prop);
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target);
      if (!keys.includes('ReactCurrentOwner')) {
        keys.push('ReactCurrentOwner');
      }
      return keys;
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop === 'ReactCurrentOwner') {
        return {
          value: stubOwner,
          writable: true,
          configurable: true,
          enumerable: true
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    }
  });

  const defineProp = (obj, prop, val) => {
    try {
      Object.defineProperty(obj, prop, {
        value: val,
        configurable: true,
        writable: true,
        enumerable: true
      });
    } catch (e) {
      try {
        obj[prop] = val;
      } catch (err) {
        console.warn(`[react19Shim] Failed to define property ${prop} on React object:`, err);
      }
    }
  };

  defineProp(React, '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED', patchedInternals);
  defineProp(React, '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE', patchedInternals);
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

