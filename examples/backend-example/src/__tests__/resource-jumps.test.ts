import { describe, expect, it } from 'vitest'
import { resourceJumpsData } from '../example-data.js'
import type { ResourceJumpsData } from '@env-hopper/backend-core'

// Mock implementation of EhBackendCompanySpecificBackend for testing
const mockBackend = {
  async getResourceJumps(): Promise<ResourceJumpsData> {
    return resourceJumpsData
  },
}

describe('ResourceJumps Backend Implementation', () => {
  it('should return ResourceJumpsData with complete structure', async () => {
    const result = await mockBackend.getResourceJumps()

    expect(result).toMatchInlineSnapshot(`
      {
        "envs": [
          {
            "displayName": "Development 01",
            "slug": "dev-01",
            "templateParams": {
              "subdomain": "dev-01",
            },
          },
          {
            "displayName": "Development 02",
            "slug": "dev-02",
            "templateParams": {
              "subdomain": "dev-02",
            },
          },
          {
            "displayName": "Development 03",
            "slug": "dev-03",
            "templateParams": {
              "subdomain": "dev-03",
            },
          },
          {
            "displayName": "Staging",
            "slug": "staging",
            "templateParams": {
              "subdomain": "staging",
            },
          },
          {
            "displayName": "User Acceptance Testing",
            "slug": "uat",
            "templateParams": {
              "subdomain": "uat",
            },
          },
          {
            "displayName": "Production",
            "slug": "prod",
            "templateParams": {
              "subdomain": "app",
            },
          },
        ],
        "lateResolvableParams": [
          {
            "displayName": "Product ID",
            "slug": "productId",
          },
          {
            "displayName": "Post ID",
            "slug": "postId",
          },
          {
            "displayName": "Kafka Topic",
            "slug": "kafkaTopic",
          },
          {
            "displayName": "Namespace",
            "slug": "namespace",
          },
          {
            "displayName": "User ID",
            "slug": "userId",
          },
        ],
        "resourceJumps": [
          {
            "displayName": "E-commerce - Products",
            "slug": "ecommerce-products",
            "urlTemplate": {
              "default": "https://{{subdomain}}.example.com/products",
            },
          },
          {
            "displayName": "E-commerce - Product Detail",
            "lateResolvableParamSlugs": [
              "productId",
            ],
            "slug": "ecommerce-product-detail",
            "urlTemplate": {
              "default": "https://{{subdomain}}.example.com/products/{{productId}}",
            },
          },
          {
            "displayName": "Blog - Posts",
            "slug": "blog-posts",
            "urlTemplate": {
              "default": "https://{{subdomain}}.example.com/posts",
            },
          },
          {
            "displayName": "Blog - Post View",
            "lateResolvableParamSlugs": [
              "postId",
            ],
            "slug": "blog-post-view",
            "urlTemplate": {
              "default": "https://{{subdomain}}.example.com/posts/{{postId}}",
            },
          },
          {
            "displayName": "Kafka UI - Topics",
            "slug": "kafka-ui-topics",
            "urlTemplate": {
              "default": "https://{{subdomain}}.example.com/kafka/topics",
            },
          },
          {
            "displayName": "Kafka UI - Topic View",
            "lateResolvableParamSlugs": [
              "kafkaTopic",
            ],
            "slug": "kafka-ui-topic-view",
            "urlTemplate": {
              "default": "https://{{subdomain}}.example.com/kafka/topics/{{kafkaTopic}}",
            },
          },
          {
            "displayName": "Temporal - Workflows",
            "slug": "temporal-workflows",
            "urlTemplate": {
              "default": "https://{{subdomain}}.example.com/temporal/workflows",
            },
          },
          {
            "displayName": "Temporal - Workflow Namespace",
            "lateResolvableParamSlugs": [
              "namespace",
            ],
            "slug": "temporal-workflow-namespace",
            "urlTemplate": {
              "default": "https://{{subdomain}}.example.com/temporal/workflows/{{namespace}}",
            },
          },
          {
            "displayName": "User Management - Users",
            "slug": "user-management-users",
            "urlTemplate": {
              "default": "https://{{subdomain}}.example.com/users",
            },
          },
          {
            "displayName": "User Management - User Profile",
            "lateResolvableParamSlugs": [
              "userId",
            ],
            "slug": "user-management-profile",
            "urlTemplate": {
              "default": "https://{{subdomain}}.example.com/users/{{userId}}",
            },
          },
        ],
      }
    `)
  })
})
