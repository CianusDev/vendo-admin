import type { Environment } from './environment.interface'

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.example.com/v1',
  logLevel: 'error',
  appName: 'React Start',
  apiTimeout: 10000,
  enableAnalytics: true,
  features: {
    enableBeta: false,
    enableNewUI: false,
  },
}
