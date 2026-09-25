// The only thing this package's unit tests need from a setup file: jest-dom's
// dom matchers. The jsdom/msw/IndexedDB setup the integration scenarios used to
// need moved to @env-hopper/test-kit along with the scenarios themselves, and
// pointing this back at that kit would make this package depend on its own
// test kit.
import '@testing-library/jest-dom'
