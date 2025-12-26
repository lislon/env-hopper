import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, ImageIcon, LayoutDashboard, MessageSquare } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '~/lib/utils'
import { Button } from '~/ui/button'
import { Breadcrumbs } from '~/ui/components/Breadcrumbs'
import { MainLayout } from '~/ui/layout/MainLayout'

export interface AdminLayoutProps {
  children: ReactNode
}

interface NavItem {
  name: string
  path: string
  icon: typeof MessageSquare
}

const navItems: NavItem[] = [
  {
    name: 'Chat',
    path: '/admin/chat',
    icon: MessageSquare,
  },
  {
    name: 'Icons',
    path: '/admin/icons',
    icon: ImageIcon,
  },
  {
    name: 'App For Catalog',
    path: '/admin/app-for-catalog',
    icon: LayoutDashboard,
  },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <MainLayout breadcrumbs={<Breadcrumbs />}>
      <div className="flex gap-6 -mx-6 -my-6 flex-1">
        {/* Left sidebar */}
        <aside
          className={cn(
            'flex flex-col transition-all duration-300',
            isCollapsed ? 'w-16' : 'w-64',
          )}
        >
          <div className="p-4 flex items-center justify-between">
            {!isCollapsed && <h1 className="text-2xl font-bold">Admin</h1>}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn('h-8 w-8', isCollapsed && 'mx-auto')}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block"
                >
                  {({ isActive }) => (
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full',
                        isCollapsed ? 'justify-center px-2' : 'justify-start',
                        isActive &&
                          'bg-primary text-primary-foreground hover:bg-primary/90',
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon className={cn('w-4 h-4', !isCollapsed && 'mr-2')} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Button>
                  )}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </main>
      </div>
    </MainLayout>
  )
}
