/**
 * Mock for @sentry/react-native
 */

export const init = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const setUser = jest.fn();
export const setContext = jest.fn();
export const addBreadcrumb = jest.fn();

export default {
  init,
  captureException,
  captureMessage,
  setUser,
  setContext,
  addBreadcrumb,
};
