import base from './playwright.tuner.config';
export default { ...base, outputDir: 'artifacts/tuner-refactor-results', webServer: { ...base.webServer, reuseExistingServer: true } };
