import React, { useState } from "react";
import { Input } from "~/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "~/components/ui/breadcrumb";
import { Slash } from "lucide-react";
import { useEhUserContext } from "~/contexts";
import { EnvDropdownSelector } from "./env/EnvDropdownSelector";
import { AppDropdownSelector } from "./app/AppDropdownSelector";

export function InteractiveBreadcrumbs() {
  const [path, setPath] = useState("");
  const { currentEnv, currentApp } = useEhUserContext();

  return (
    <div className="flex gap-3 items-center w-full">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <EnvDropdownSelector />
          </BreadcrumbItem>
          
          <BreadcrumbSeparator />
          
          <BreadcrumbItem>
            <AppDropdownSelector />
          </BreadcrumbItem>
          
          {path && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{path}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}

          
        <BreadcrumbSeparator />

<BreadcrumbItem>
{/* Page/Parameter Input */}
<Input
className="flex-1 max-w-xs"
placeholder="/page / orderId …"
value={path}
onChange={(e) => setPath(e.target.value)}
/>
  </BreadcrumbItem>
        </BreadcrumbList>

      </Breadcrumb>


    </div>
  );
} 