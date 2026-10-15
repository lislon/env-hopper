export interface ImageRef {
  registry: string | null
  repository: string
  tag: string
}

export interface K8sWorkloadRecord {
  cluster: string
  namespace: string
  name: string
  kind: 'Deployment'
  images: Array<ImageRef>
  labels: Record<string, string>
  annotations: Record<string, string>
  replicas: number
  readyReplicas: number
}

export interface K8sIngressRecord {
  cluster: string
  namespace: string
  name: string
  hosts: Array<string>
  paths: Array<string>
  tlsHosts: Array<string>
  backendServices: Array<string>
}

export interface K8sSource {
  listWorkloads: () => Promise<Array<K8sWorkloadRecord>>
  listIngresses: () => Promise<Array<K8sIngressRecord>>
}

// Raw k8s API response types (minimal shapes)
export interface RawDeployment {
  metadata?: {
    namespace?: string
    name?: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
  }
  spec?: {
    replicas?: number
    template?: {
      spec?: {
        containers?: Array<{ image?: string }>
      }
    }
  }
  status?: {
    readyReplicas?: number
  }
}

export interface RawIngress {
  metadata?: {
    namespace?: string
    name?: string
  }
  spec?: {
    tls?: Array<{
      hosts?: Array<string>
    }>
    rules?: Array<{
      host?: string
      http?: {
        paths?: Array<{
          path?: string
          backend?: {
            service?: {
              name?: string
            }
          }
        }>
      }
    }>
  }
}

// Narrow client interfaces matching @kubernetes/client-node 0.22
export interface K8sAppsClient {
  listDeploymentForAllNamespaces: (
    allowWatchBookmarks?: boolean,
    _continue?: string,
    fieldSelector?: string,
    labelSelector?: string,
    limit?: number,
    pretty?: string,
    resourceVersion?: string,
    resourceVersionMatch?: string,
    sendInitialEvents?: boolean,
    timeoutSeconds?: number,
    watch?: boolean,
  ) => Promise<{
    body: { items: Array<RawDeployment>; metadata?: { _continue?: string } }
  }>
  readNamespacedDeployment: (
    name: string,
    namespace: string,
    pretty?: string,
  ) => Promise<{ body: RawDeployment }>
}

export interface K8sNetworkingClient {
  listIngressForAllNamespaces: (
    allowWatchBookmarks?: boolean,
    _continue?: string,
    fieldSelector?: string,
    labelSelector?: string,
    limit?: number,
    pretty?: string,
    resourceVersion?: string,
    resourceVersionMatch?: string,
    sendInitialEvents?: boolean,
    timeoutSeconds?: number,
    watch?: boolean,
  ) => Promise<{
    body: { items: Array<RawIngress>; metadata?: { _continue?: string } }
  }>
}
