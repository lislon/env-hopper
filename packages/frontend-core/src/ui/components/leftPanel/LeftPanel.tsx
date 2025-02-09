import { useState } from 'react'
import {
  FileText,
  FolderOpen,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cn } from '~/lib/utils'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'

interface HierarchyNode {
  id: string
  label: string
  type: 'env' | 'app' | 'group' | 'page'
  children?: Array<HierarchyNode>
}

interface LeftPanelProps {
  className?: string
}

// Function to build hierarchy data from real context data (most visited)
function buildHierarchyFromContext(indexData: any): Array<HierarchyNode> {
  const hierarchyData: Array<HierarchyNode> = []

  // Take a subset of environments representing most visited
  const envs = Object.values(indexData.envs).slice(0, 3) // Take first 3 environments

  envs.forEach((env: any) => {
    const envNode: HierarchyNode = {
      id: `env-${env.slug}`,
      label: env.displayName || env.slug,
      type: 'env',
      children: [],
    }

    // Take a subset of apps for each environment (most visited)
    const apps = Object.values(indexData.apps).slice(0, 3) // Take first 3 apps per env

    apps.forEach((app: any) => {
      const appNode: HierarchyNode = {
        id: `env-${env.slug}-app-${app.slug}`,
        label: app.displayName || app.slug,
        type: 'app',
        children: [],
      }

      // Add a few top pages if the app has UI structure
      if (app.ui && app.ui.groups && app.ui.groups.length > 0) {
        // Take the first group and show some pages directly under the app
        const firstGroup = app.ui.groups[0]
        if (firstGroup.pages && firstGroup.pages.length > 0) {
          firstGroup.pages.slice(0, 2).forEach((page: any) => {
            // Limit to 2 pages per app
            appNode.children!.push({
              id: `env-${env.slug}-app-${app.slug}-page-${page.slug}`,
              label: page.title || page.slug,
              type: 'page',
            })
          })
        }
      } else {
        // If no groups, create a main page
        appNode.children!.push({
          id: `env-${env.slug}-app-${app.slug}-page-main`,
          label: 'Dashboard',
          type: 'page',
        })
      }

      envNode.children!.push(appNode)
    })

    hierarchyData.push(envNode)
  })

  return hierarchyData
}

function getIconForType(type: HierarchyNode['type']) {
  switch (type) {
    case 'env':
      return <Server className="w-4 h-4" />
    case 'app':
      return <Package className="w-4 h-4" />
    case 'group':
      return <FolderOpen className="w-4 h-4" />
    case 'page':
      return <FileText className="w-4 h-4" />
    default:
      return null
  }
}

interface HierarchyItemProps {
  node: HierarchyNode
  level: number
}

function HierarchyItem({ node, level }: HierarchyItemProps) {
  const hasChildren = node.children && node.children.length > 0
  const indent = level * 20 // 20px per level for better visual hierarchy

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-accent/50 hover:text-accent-foreground transition-colors',
          level === 0 && 'font-semibold text-sm',
          level === 1 && 'font-medium text-sm',
          level === 2 && 'text-sm text-muted-foreground',
        )}
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">
            {getIconForType(node.type)}
          </div>
          <span className="truncate">{node.label}</span>
        </div>
      </div>

      {hasChildren && (
        <div>
          {node.children!.map((child) => (
            <HierarchyItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function LeftPanel({ className }: LeftPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const indexData = useBootstrapConfig()

  // Build hierarchy data from real context data
  const hierarchyData = buildHierarchyFromContext(indexData)

  return (
    <div className={cn('flex', className)}>
      {/* Collapse/Expand Button */}
      {isCollapsed && (
        <div className="flex items-center justify-center w-8 bg-background border-r">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="h-6 w-6 p-0"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Panel */}
      <div
        className={cn(
          'bg-background border-r transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-0 overflow-hidden' : 'w-80',
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-sm font-semibold">Most Visited</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="h-6 w-6 p-0"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          {/* Hierarchy Content */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-0.5">
              {hierarchyData.map((node) => (
                <HierarchyItem key={node.id} node={node} level={0} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
