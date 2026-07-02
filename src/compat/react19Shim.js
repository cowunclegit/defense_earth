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
// React 19 changed Symbol.for('react.element') to Symbol.for('react.transitional.element').
// To make react-reconciler@0.27.0 (which checks Symbol.for('react.element')) recognize React 19 elements,
// we override Symbol.for to return the transitional element symbol for 'react.element'.
if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
  const originalSymbolFor = Symbol.for;
  Symbol.for = function (key) {
    if (key === 'react.element') {
      return originalSymbolFor('react.transitional.element');
    }
    return originalSymbolFor(key);
  };
}

import React from 'react';
import { Alert } from 'react-native';

// React 19 renamed __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
// to __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.
const originalInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED || React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
if (originalInternals) {
  const stubOwner = { current: null };

  let savedReact19Dispatcher = null;

  const stubDispatcher = {
    get current() {
      // In React 19, originalInternals.H IS the active dispatcher object itself (no .current wrapper!).
      // But react-reconciler (React 18) expects a wrapper object `{ current: dispatcher }`.
      return originalInternals.H;
    },
    set current(val) {
      if (val) {
        // In react-reconciler, the error/idle dispatcher (Oe) uses the same dummy function 
        // that throws an error for almost all hooks. We can identify it by checking if 
        // useCallback and useRef point to the exact same function reference.
        // Active rendering dispatchers (Le and Me) have distinct implementations.
        const isErrorDispatcher = val.useCallback && val.useRef && (val.useCallback === val.useRef);

        if (isErrorDispatcher) {
          // Reconciler is resetting to idle/error state (Oe). Restore React Native dispatcher.
          originalInternals.H = savedReact19Dispatcher;
        } else {
          // Reconciler is setting active dispatcher (Le or Me).
          // Save the current React Native dispatcher (which is originalInternals.H itself)
          // and set H to Le/Me so that hooks called inside Skia components resolve successfully.
          savedReact19Dispatcher = originalInternals.H;
          originalInternals.H = val;
        }
      } else {
        originalInternals.H = savedReact19Dispatcher;
      }
    }
  };

  const stubBatchConfig = {
    get transition() {
      return originalInternals.T ? originalInternals.T.transition : null;
    },
    set transition(val) {
      if (originalInternals.T) {
        originalInternals.T.transition = val;
      }
    }
  };

  const patchedInternals = new Proxy(originalInternals, {
    get(target, prop) {
      if (prop === 'ReactCurrentOwner') {
        return stubOwner;
      }
      if (prop === 'ReactCurrentDispatcher') {
        return stubDispatcher;
      }
      if (prop === 'ReactCurrentBatchConfig') {
        return stubBatchConfig;
      }
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
    has(target, prop) {
      if (prop === 'ReactCurrentOwner' || prop === 'ReactCurrentDispatcher' || prop === 'ReactCurrentBatchConfig') {
        return true;
      }
      return Reflect.has(target, prop);
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target);
      if (!keys.includes('ReactCurrentOwner')) keys.push('ReactCurrentOwner');
      if (!keys.includes('ReactCurrentDispatcher')) keys.push('ReactCurrentDispatcher');
      if (!keys.includes('ReactCurrentBatchConfig')) keys.push('ReactCurrentBatchConfig');
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
      if (prop === 'ReactCurrentDispatcher') {
        return {
          value: stubDispatcher,
          writable: true,
          configurable: true,
          enumerable: true
        };
      }
      if (prop === 'ReactCurrentBatchConfig') {
        return {
          value: stubBatchConfig,
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

