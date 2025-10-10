# Entity-Based Architecture Design

## Overview

Restructure env-hopper to use a Backstage.io-inspired entity system with explicit `kind` discriminators, enabling pluggable architecture for different resource types.

## Core Principles

- **Flat entity model** with explicit references (Backstage-style)
- **Static ResourceJumps** defined in configuration
- **Explicit relationships** between entities
- **Breaking changes acceptable** for cleaner architecture

## Entity Base Structure

All entities follow this pattern:

```yaml
kind: EntityKind
metadata:
  slug: string
  displayName: string
  labels?: Record<string, string>
spec:
  # Kind-specific properties
```

## Entity Examples

### Environment Entity

```yaml
kind: Environment
metadata:
  slug: dev-01
  displayName: Development 01
spec:
  templateParams:
    subdomain: dev-01
    region: us-east-1
```

### App Entity

```yaml
kind: App
metadata:
  slug: order-service
  displayName: Order Service
spec:
  kafkaTopics:
    outgoing: [order-created, order-updated]
    incoming: [payment-processed]
  databases: [orders-db]
  apis: [orders-api]
```

### KafkaTopic Entity

```yaml
kind: KafkaTopic
metadata:
  slug: order-created
  displayName: Order Created Events
spec:
  name: order.created.v1
  cluster: main-cluster
  viewableVia: kafka-ui-topic
```

### ResourceJump Entity

```yaml
kind: ResourceJump
metadata:
  slug: kafka-ui-topic
  displayName: Kafka UI - Topic View
spec:
  urlTemplate:
    default: https://{{subdomain}}-kafka.example.com/topics/{{topicName}}
  parameters:
    - name: subdomain
      source: environment
    - name: topicName
      source: entity
      entityKind: KafkaTopic
      field: name
```

### Database Entity

```yaml
kind: Database
metadata:
  slug: orders-db
  displayName: Orders Database
spec:
  type: postgresql
  cluster: main-db-cluster
  viewableVia: pgadmin-db
```

### API Entity

```yaml
kind: API
metadata:
  slug: orders-api
  displayName: Orders API
spec:
  baseUrl: https://{{subdomain}}.example.com/api/v1
  documentation: https://docs.example.com/orders-api
  viewableVia: swagger-ui-api
```

## Parameter Sources

Parameters can be resolved from different sources:

- **environment**: From environment's templateParams
- **userInput**: User provides at runtime (late resolvable)
- **entity**: From a related entity's spec field

## Example Scenarios

### Scenario: View Kafka Topic in UI

1. User selects "Order Service" app
2. System shows outgoing topics: `order-created`, `order-updated`
3. User clicks "order-created" topic
4. System finds KafkaTopic entity with `viewableVia: kafka-ui-topic`
5. System finds ResourceJump entity for Kafka UI
6. Parameter resolution:
   - `subdomain`: from current environment (`dev-01`)
   - `topicName`: from KafkaTopic entity (`order.created.v1`)
7. Final URL: `https://dev-01-kafka.example.com/topics/order.created.v1`

### Scenario: Cross-Environment Navigation

1. User is viewing topic in `dev-01` environment
2. User switches to `prod` environment
3. System resolves same topic with prod subdomain
4. Final URL: `https://app-kafka.example.com/topics/order.created.v1`

## Backend API Changes

### New Interface Methods

```typescript
interface EhBackendCompanySpecificBackend {
  // Existing methods (for backwards compatibility)
  getBootstrapData: () => Promise<BootstrapConfigData>
  getResourceJumps: () => Promise<ResourceJumpsData>

  // New entity-based methods
  getCatalog: () => Promise<CatalogData>
  getEntitiesByKind: (kind: string) => Promise<Entity[]>
  getEntity: (slug: string) => Promise<Entity>
  getRelatedEntities: (slug: string, relationship: string) => Promise<Entity[]>
}
```

### Catalog Data Structure

```typescript
interface CatalogData {
  entities: Entity[]
  byKind: Record<string, Entity[]>
  bySlug: Record<string, Entity>
}
```

## Breaking Changes

- ResourceJumps become regular entities (not special)
- Environment data moved to entity format
- App data restructured with explicit relationships
- Parameter resolution system unified
- Backend interface extended (existing methods kept for compatibility)

## Migration Path

1. Create new entity types alongside existing structures
2. Implement new backend methods
3. Update frontend to use entity-based data
4. Remove old data structures
5. Clean up backwards compatibility methods
