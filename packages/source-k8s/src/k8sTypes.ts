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
  replicas: number
  readyReplicas: number
}

export interface K8sIngressRecord {
  cluster: string
  namespace: string
  name: string
  hosts: Array<string>
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
    rules?: Array<{
      host?: string
      http?: {
        paths?: Array<{
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
