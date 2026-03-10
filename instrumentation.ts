export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 应用启动中...')
    
    try {
      const { validateEnv } = await import('./lib/env')
      validateEnv()
    } catch (error) {
      console.error('❌ 环境变量验证失败:', error)
    }
    
    try {
      const { initRedis } = await import('./lib/cache-adapter')
      await initRedis()
      console.log('✅ Redis初始化完成')
    } catch (error) {
      console.error('❌ Redis初始化失败:', error)
      console.log('⚠️ 将使用内存缓存模式')
    }
    
    try {
      const { initCacheHealthCheck } = await import('./lib/cache')
      await initCacheHealthCheck()
      console.log('✅ 缓存健康检查启动')
    } catch (error) {
      console.error('❌ 缓存健康检查启动失败:', error)
    }
    
    try {
      const { loadAllConfigsFromDB } = await import('./lib/system-config')
      await loadAllConfigsFromDB()
      console.log('✅ 系统配置加载完成')
    } catch (error) {
      console.error('❌ 系统配置加载失败:', error)
    }
    
    try {
      const { loadCacheConfig } = await import('./lib/cache')
      await loadCacheConfig()
      console.log('✅ 缓存配置加载完成')
    } catch (error) {
      console.error('❌ 缓存配置加载失败:', error)
    }
    
    try {
      const { loadHeatConfig, loadBatchConfig } = await import('./lib/calculateHeat')
      await loadHeatConfig()
      await loadBatchConfig()
      console.log('✅ 热度计算配置加载完成')
    } catch (error) {
      console.error('❌ 热度计算配置加载失败:', error)
    }
  }
}
