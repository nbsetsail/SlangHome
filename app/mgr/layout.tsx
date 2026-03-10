'use client'
import React, { useEffect, useState, createContext, useContext } from 'react'
import { useSession, SessionProvider } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getAccessibleMenuItems } from '@/lib/permissions'

type SessionContextType = {
  session: any
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function useMgrSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useMgrSession must be used within a MgrLayout')
  }
  return context.session
}

function MgrContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession({ required: true })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [manuallyExpanded, setManuallyExpanded] = useState<string | null>(null)

  const contentGroup = ['Users', 'Slangs', 'Categories', 'Tags', 'Comments', 'Reports', 'Stats', 'Notifications', 'Emails']
  const adGroup = ['Advertisements', 'Ad Slots', 'Ad Stats']
  const systemGroup = ['PK', 'Logs', 'Backup', 'Configuration']

  // If session is not loaded, NextAuth will automatically redirect to signin
  if (status === 'loading' || !session || !session.user) {
    return null
  }

  // Check if user has permission to access management area
  if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-700 mb-4">You don&apos;t have permission to access the management area.</p>
          <Link 
            href="/" 
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Navigation items based on user role
  const navigationItems = getAccessibleMenuItems(session.user.role)

  // Group menu items
  const groupedItems = {
    content: navigationItems.filter(item => contentGroup.includes(item.name)),
    ad: navigationItems.filter(item => adGroup.includes(item.name)),
    system: navigationItems.filter(item => systemGroup.includes(item.name)),
    dashboard: navigationItems.filter(item => item.name === 'Dashboard')
  }

  // Find current item and determine which group should be expanded
  // Sort by href length descending to match more specific paths first
  const sortedItems = [...navigationItems].sort((a, b) => b.href.length - a.href.length)
  const currentItem = sortedItems.find(item => 
    pathname === item.href || pathname.startsWith(item.href + '/')
  )
  
  const autoExpandedGroup = currentItem
    ? contentGroup.includes(currentItem.name)
      ? 'content'
      : adGroup.includes(currentItem.name)
        ? 'ad'
        : systemGroup.includes(currentItem.name)
          ? 'system'
          : null
    : null

  // Use manual expansion if set, otherwise use auto-detected group
  const expandedGroups = manuallyExpanded ? [manuallyExpanded] : (autoExpandedGroup ? [autoExpandedGroup] : [])

  // Check if a navigation item is current based on pathname
  const isCurrentPath = (href: string) => {
    if (href === '/mgr') {
      return pathname === '/mgr'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Toggle group expansion (accordion style - only one group open at a time)
  const toggleGroup = (group: string) => {
    setManuallyExpanded(prev => prev === group ? null : group)
  }

  return (
    <SessionContext.Provider value={{ session }}>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow fixed top-0 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {session.user.role === 'admin' ? 'Admin Dashboard' : 'Moderator Dashboard'}
                </h1>
                <p className="text-gray-600">Management Area</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {session.user.name}</span>
                <Link 
                  href="/" 
                  className="text-blue-500 hover:text-blue-600"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="flex pt-20">
          {/* Sidebar */}
          <aside className={`fixed left-0 top-20 bottom-0 bg-white shadow-lg transition-all duration-300 z-10 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
            {/* Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-3 top-4 bg-white rounded-full shadow p-1 hover:bg-gray-50"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Navigation */}
            <nav className="p-2 overflow-y-auto h-full">
              {/* Dashboard */}
              {groupedItems.dashboard.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 mb-2 rounded-md ${
                    isCurrentPath(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              ))}

              <div className="border-t my-2"></div>

              {/* Content Group */}
              <div>
                <button
                  onClick={() => toggleGroup('content')}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-md"
                >
                  <span>Content</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${expandedGroups.includes('content') ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedGroups.includes('content') && (
                  <div className="ml-2 mt-1 space-y-1">
                    {groupedItems.content.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2 rounded-md ${
                          isCurrentPath(item.href)
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {!isSidebarCollapsed && <span>{item.name}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Ad Group - Only show for admin */}
              {groupedItems.ad.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => toggleGroup('ad')}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-md"
                  >
                    <span>Ad</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${expandedGroups.includes('ad') ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedGroups.includes('ad') && (
                    <div className="ml-2 mt-1 space-y-1">
                      {groupedItems.ad.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center px-3 py-2 rounded-md ${
                            isCurrentPath(item.href)
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-3">{item.icon}</span>
                          {!isSidebarCollapsed && <span>{item.name}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* System Group - Only show for admin */}
              {groupedItems.system.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => toggleGroup('system')}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-md"
                  >
                    <span>System</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${expandedGroups.includes('system') ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedGroups.includes('system') && (
                    <div className="ml-2 mt-1 space-y-1">
                      {groupedItems.system.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center px-3 py-2 rounded-md ${
                            isCurrentPath(item.href)
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-3">{item.icon}</span>
                          {!isSidebarCollapsed && <span>{item.name}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </aside>

          {/* Main content */}
          <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SessionContext.Provider>
  )
}

export default function MgrLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <MgrContent>{children}</MgrContent>
    </SessionProvider>
  )
}
