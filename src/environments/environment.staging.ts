import type { Environment } from './environment.interface'

export const environment: Environment = {
  production: false,
  apiUrl: 'https://backend-staging.example.com/v1',
  logLevel: 'info',
  appName: 'React Start Staging',
  apiTimeout: 20000,
  enableAnalytics: true,
  features: {
    enableBeta: true,
    enableNewUI: false,
  },
}
