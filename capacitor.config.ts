import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kayori.ai',
  appName: 'AI-Kayori',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#0A0A0A',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#0A0A0A',
      showSpinner: false
    },
    StatusBar: {
      backgroundColor: '#0A0A0A',
      style: 'DARK'
    }
  }
}

export default config
