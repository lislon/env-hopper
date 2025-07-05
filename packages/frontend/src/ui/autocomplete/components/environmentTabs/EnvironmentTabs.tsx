import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Server, Package, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { EnvDropdownSelector } from "../controlPanel/env/EnvDropdownSelector";

interface EnvironmentTabsProps {
  onEnvironmentChange?: (environment: string) => void;
  defaultEnvironment?: string;
}

const environments = [
  {
    id: "sig-dev-deploy-08",
    label: "sig-dev-deploy-08",
    icon: Server,
    color: "text-blue-500",
  },
  {
    id: "cross-04",
    label: "cross-04",
    icon: Package,
    color: "text-green-500",
  },
  {
    id: "production",
    label: "production",
    icon: Globe,
    color: "text-red-500",
  },
];

export function EnvironmentTabs({ onEnvironmentChange, defaultEnvironment = "sig-dev-deploy-08" }: EnvironmentTabsProps) {
  const [currentEnvironment, setCurrentEnvironment] = useState(defaultEnvironment);

  // Remove custom keyboard handling - let Radix handle it natively for proper focus-visible

  const handleEnvironmentChange = (environment: string) => {
    setCurrentEnvironment(environment);
    onEnvironmentChange?.(environment);
  };

  return (
    <div>
      <Tabs value={currentEnvironment} onValueChange={handleEnvironmentChange}>
        {/* Flex container for tabs and dropdown */}
        <div className="flex items-center justify-between gap-4">
          <TabsList className="grid grid-cols-3 flex-shrink-0">
            {environments.map((env) => {
              const Icon = env.icon;
              const isActive = env.id === currentEnvironment;
              return (
                <TabsTrigger 
                  key={env.id} 
                  value={env.id}
                  className="relative flex items-center gap-2 data-[state=active]:text-secondary-foreground"
                >
                  {/* Background indicator that moves with layout animations */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-secondary rounded-full z-0"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${env.color}`} />
                    <span className="text-md font-medium">
                      {env.label}
                    </span>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {/* Environment Dropdown Selector on the right */}
          <div className="flex-shrink-0 min-w-0">
            <EnvDropdownSelector />
          </div>
        </div>
        
        {/* {environments.map((env) => (
          <TabsContent 
            key={env.id} 
            value={env.id} 
            className="mt-6"
          >
            <div className="min-h-[200px] flex items-center justify-center border border-border rounded-lg bg-card text-card-foreground p-8 shadow-sm">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <env.icon className={`w-6 h-6 ${env.color}`} />
                  <span className="text-xl font-semibold text-card-foreground">
                    {env.label}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Content for {env.label} environment will be wrapped here
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <div className={`w-2 h-2 rounded-full ${env.color} bg-current`} />
                    <span>Environment Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        ))} */}
      </Tabs>
    </div>
  );
}

interface VerticalEnvironmentSwitcherProps {
  onEnvironmentChange?: (environment: string) => void;
  defaultEnvironment?: string;
}

export function VerticalEnvironmentSwitcher({ onEnvironmentChange, defaultEnvironment = "sig-dev-deploy-08" }: VerticalEnvironmentSwitcherProps) {
  const [currentEnvironment, setCurrentEnvironment] = useState(defaultEnvironment);

  const handleEnvironmentChange = (environment: string) => {
    setCurrentEnvironment(environment);
    onEnvironmentChange?.(environment);
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      {environments.map((env) => {
        const Icon = env.icon;
        const isActive = env.id === currentEnvironment;
        
        return (
          <button
            key={env.id}
            onClick={() => handleEnvironmentChange(env.id)}
            className={`
              relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200
              hover:bg-accent hover:text-accent-foreground
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              ${isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground'}
            `}
          >
            {/* Background indicator that moves with layout animations */}
            {isActive && (
              <motion.div
                layoutId="activeVerticalIndicator"
                className="absolute inset-0 bg-secondary rounded-lg z-0"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            
            {/* Content */}
            <div className="relative z-10 flex items-center gap-3 w-full">
              <Icon className={`w-5 h-5 ${env.color} flex-shrink-0`} />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">
                  {env.label}
                </span>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-1 text-xs"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${env.color} bg-current`} />
                    <span>Active</span>
                  </motion.div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
} 