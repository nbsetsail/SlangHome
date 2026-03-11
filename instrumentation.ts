export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Application starting...')
    
    try {
      const { validateEnv } = await import('./lib/env')
      validateEnv()
    } catch (error) {
      console.error('❌ Environment validation failed:', error)
    }
    
    try {
      const { initRedis } = await import('./lib/cache-adapter')
      await initRedis()
      console.log('✅ Redis initialized')
    } catch (error) {
      console.error('❌ Redis initialization failed:', error)
      console.log('⚠️ Falling back to memory cache mode')
    }
    
    try {
      const { initCacheHealthCheck } = await import('./lib/cache')
      await initCacheHealthCheck()
      console.log('✅ Cache health check started')
    } catch (error) {
      console.error('❌ Cache health check failed to start:', error)
    }
    
    try {
      const { loadAllConfigsFromDB } = await import('./lib/system-config')
      await loadAllConfigsFromDB()
      console.log('✅ System config loaded')
    } catch (error) {
      console.error('❌ System config load failed:', error)
    }
    
    try {
      const { loadCacheConfig } = await import('./lib/cache')
      await loadCacheConfig()
      console.log('✅ Cache config loaded')
    } catch (error) {
      console.error('❌ Cache config load failed:', error)
    }
    
    try {
      const { loadHeatConfig, loadBatchConfig } = await import('./lib/calculateHeat')
      await loadHeatConfig()
      await loadBatchConfig()
      console.log('✅ Heat calculation config loaded')
    } catch (error) {
      console.error('❌ Heat calculation config load failed:', error)
    }
  }
}
