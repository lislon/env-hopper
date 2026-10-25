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
  /**
   * When the current rollout last progressed (the `Progressing` condition's
   * `lastUpdateTime`), as ISO 8601; absent when the cluster reports none.
   */
  rolledOutAt?: string
  /**
   * While a rollout is under way, the images the Ready pods run: those of the
   * newest older ReplicaSet with Ready pods. Absent when the spec serves, or
   * when nothing tells (no ReplicaSets read, nothing Ready).
   */
  servingImages?: Array<ImageRef>
}

/** A ReplicaSet that has pods, trimmed to what says which images serve. */
export interface K8sReplicaSetRecord {
  namespace: string
  name: string
  /** The Deployment that owns it. */
  owner: string
  /** Its `deployment.kubernetes.io/revision`; 0 when absent. */
  revision: number
  images: Array<ImageRef>
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
    resourceVersion?: string
  }
  spec?: {
    replicas?: number
    /** Which pods, and so which ReplicaSets, are its own. */
    selector?: { matchLabels?: Record<string, string> }
    template?: {
      spec?: {
        containers?: Array<{ image?: string }>
      }
    }
  }
  status?: {
    /** Pods of every revision. */
    replicas?: number
    /** Pods of the current revision. */
    updatedReplicas?: number
    readyReplicas?: number
    /** The client parses times into Dates; a watch event carries strings. */
    conditions?: Array<{ type?: string; lastUpdateTime?: string | Date }>
  }
}

export interface RawReplicaSet {
  metadata?: {
    namespace?: string
    name?: string
    annotations?: Record<string, string>
    ownerReferences?: Array<{ kind?: string; name?: string }>
    resourceVersion?: string
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
    replicas?: number
    readyReplicas?: number
  }
}

export interface RawIngress {
  metadata?: {
    namespace?: string
    name?: string
    resourceVersion?: string
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

/** A list's metadata: where to continue, and the version to watch from. */
export interface K8sListMeta {
  _continue?: string
  resourceVersion?: string
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
    body: { items: Array<RawDeployment>; metadata?: K8sListMeta }
  }>
  /** A Deployment's own ReplicaSets, by its selector; read only mid-rollout. */
  listNamespacedReplicaSet: (
    namespace: string,
    pretty?: string,
    allowWatchBookmarks?: boolean,
    _continue?: string,
    fieldSelector?: string,
    labelSelector?: string,
  ) => Promise<{
    body: { items: Array<RawReplicaSet>; metadata?: K8sListMeta }
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
    body: { items: Array<RawIngress>; metadata?: K8sListMeta }
  }>
}
