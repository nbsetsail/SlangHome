'use client'

import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useLocale } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'

declare global {
  interface Window {
    paypal?: any
  }
}

const supportTiers = [
  { id: 'coffee', amount: 4.99, name: 'Coffee', nameZh: '一杯咖啡', icon: '☕' , highlight: true},
  { id: 'lunch', amount: 9.99, name: 'Lunch', nameZh: '一顿午餐', icon: '🍔' },
  { id: 'premium', amount: 19.99, name: 'Premium', nameZh: '高级支持', icon: '⭐' }
]

const MIN_AMOUNT = 3
const MAX_AMOUNT = 100

export default function SupportPage() {
  const locale = useLocale()
  const { cn } = useTheme()
  const [selectedTier, setSelectedTier] = useState('premium')
  const [customAmount, setCustomAmount] = useState('')
  const [activationCode, setActivationCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paypalReady, setPaypalReady] = useState(false)
  
  const isZh = locale === 'zh'
  const tierAmount = supportTiers.find(t => t.id === selectedTier)?.amount || 0
  const customNum = parseFloat(customAmount) || 0
  const currentAmount = customAmount ? Math.min(Math.max(customNum, MIN_AMOUNT), MAX_AMOUNT) : tierAmount
  
  useEffect(() => {
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'}&currency=USD&intent=capture`
    script.async = true
    script.onload = () => setPaypalReady(true)
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])
  
  useEffect(() => {
    if (paypalReady && window.paypal && !activationCode) {
      const container = document.getElementById('paypal-button-container')
      if (container) {
        container.innerHTML = ''
        
        window.paypal.Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: currentAmount.toString()
                },
                description: `Slang Home Support - $${currentAmount}`
              }]
            })
          },
          onApprove: async (data: any, actions: any) => {
            setLoading(true)
            setError(null)
            
            try {
              const details = await actions.order.capture()
              const payerEmail = details.payer?.email_address || ''
              
              const response = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  data: {
                    email: payerEmail,
                    amount: currentAmount.toString(),
                    currency: 'USD',
                    transaction_id: details.id
                  }
                })
              })
              
              const result = await response.json()
              
              if (result.success && result.code) {
                setActivationCode(result.code)
              } else {
                throw new Error(result.error || 'Failed to generate code')
              }
            } catch (err) {
              console.error('Payment error:', err)
              setError(isZh ? '生成激活码失败，请联系支持' : 'Failed to generate code, please contact support')
            } finally {
              setLoading(false)
            }
          },
          onError: (err: any) => {
            console.error('PayPal error:', err)
            setError(isZh ? '支付失败，请重试' : 'Payment failed, please try again')
          }
        }).render('#paypal-button-container')
      }
    }
  }, [paypalReady, currentAmount, activationCode, isZh])
  
  const copyCode = () => {
    if (activationCode) {
      navigator.clipboard.writeText(activationCode)
    }
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold ${cn.colors.text.primary} mb-2`}>
              {isZh ? '支持 Slang Home' : 'Support Slang Home'}
            </h1>
            <p className={cn.colors.text.secondary}>
              {isZh ? '你的支持是我们持续改进的动力' : 'Your support helps us keep improving'}
            </p>
          </div>
          
          {activationCode ? (
            <div className={`${cn.colors.bg.card} rounded-xl border-2 border-green-500 p-8 text-center`}>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className={`text-2xl font-bold ${cn.colors.text.primary} mb-2`}>
                {isZh ? '感谢你的支持！' : 'Thank you for your support!'}
              </h2>
              <p className={cn.colors.text.secondary} className="mb-6">
                {isZh ? '你的激活码：' : 'Your activation code:'}
              </p>
              
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-3xl font-mono py-4 px-6 rounded-lg mb-4 tracking-widest">
                {activationCode}
              </div>
              
              <button
                onClick={copyCode}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {isZh ? '复制激活码' : 'Copy Code'}
              </button>
              
              <div className={`mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left ${cn.colors.text.secondary}`}>
                <h3 className={`font-medium ${cn.colors.text.primary} mb-2`}>
                  {isZh ? '如何激活：' : 'How to activate:'}
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>{isZh ? '打开 Slang Home 浏览器扩展' : 'Open Slang Home browser extension'}</li>
                  <li>{isZh ? '点击"激活"按钮' : 'Click the "Activate" button'}</li>
                  <li>{isZh ? '输入上面的激活码' : 'Enter the code above'}</li>
                  <li>{isZh ? '享受高级功能！' : 'Enjoy premium features!'}</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              <div className={`${cn.colors.bg.card} rounded-xl border ${cn.colors.border.default} p-6 mb-6`}>
                <h2 className={`text-lg font-semibold ${cn.colors.text.primary} mb-4`}>
                  {isZh ? '选择支持金额' : 'Select Amount'}
                </h2>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {supportTiers.map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => {
                        setSelectedTier(tier.id)
                        setCustomAmount('')
                      }}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-center
                        ${selectedTier === tier.id 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                          : `border-gray-200 dark:border-gray-700 hover:border-orange-300`}
                        ${tier.highlight ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
                      `}
                    >
                      <div className="text-2xl mb-1">{tier.icon}</div>
                      <div className={`font-medium ${cn.colors.text.primary}`}>
                        {isZh ? tier.nameZh : tier.name}
                      </div>
                      <div className={`text-sm ${cn.colors.text.secondary}`}>
                        ${tier.amount}
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mb-6">
                  <label className={`block text-sm font-medium ${cn.colors.text.secondary} mb-2`}>
                    {isZh ? '或自定义金额' : 'Or custom amount'}
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${cn.colors.text.secondary}`}>$</span>
                    <input
                      type="number"
                      min={MIN_AMOUNT}
                      max={MAX_AMOUNT}
                      step="1"
                      value={customAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (value > MAX_AMOUNT) {
                          setError(isZh ? `最大金额为 $${MAX_AMOUNT}` : `Maximum amount is $${MAX_AMOUNT}`)
                        } else if (value < MIN_AMOUNT && e.target.value !== '') {
                          setError(isZh ? `最小金额为 $${MIN_AMOUNT}` : `Minimum amount is $${MIN_AMOUNT}`)
                        } else {
                          setError(null)
                        }
                        setCustomAmount(e.target.value)
                        setSelectedTier('')
                      }}
                      placeholder={`${MIN_AMOUNT}.00 - ${MAX_AMOUNT}.00`}
                      className={`w-full pl-8 pr-4 py-2 rounded-lg border ${cn.colors.border.default} ${cn.colors.bg.card} focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                    />
                  </div>
                  <p className={`mt-1 text-xs ${cn.colors.text.secondary}`}>
                    {isZh ? `支持金额: $${MIN_AMOUNT} - $${MAX_AMOUNT}` : `Amount: $${MIN_AMOUNT} - $${MAX_AMOUNT}`}
                  </p>
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div id="paypal-button-container" className="min-h-[150px]">
                  {!paypalReady && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`${cn.colors.bg.card} rounded-xl border ${cn.colors.border.default} p-6`}>
                <h2 className={`text-lg font-semibold ${cn.colors.text.primary} mb-4`}>
                  {isZh ? '支持者权益' : 'Supporter Benefits'}
                </h2>
                
                <ul className="space-y-3">
                  {[
                    { icon: '✨', text: isZh ? '解锁所有高级功能' : 'Unlock all premium features' },
                    { icon: '🚀', text: isZh ? '优先获得新功能' : 'Early access to new features' },
                    { icon: '📧', text: isZh ? '优先邮件支持' : 'Priority email support' },
                    { icon: '❤️', text: isZh ? '帮助项目持续发展' : 'Help the project grow' }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className={cn.colors.text.primary}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}
