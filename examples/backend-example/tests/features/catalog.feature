Feature: Deployment catalog

  Scenario: One component runs several instances in one environment
    Given the "multi-instance" catalog is synced
    When I list the deployments of app "ledger" in "prod"
    Then I see 3 deployments
    And "ledger-api" on "prod-eu" runs "main-42"
    And "ledger-api" on "prod-us" runs "release-7"

  Scenario: An alias means the most recently built artifact
    Given the "aliases" catalog is synced
    Then alias "spring" of "ledger-api" resolves to "main-43"

  Scenario: A failed source keeps the last known deployments
    Given the "multi-instance" catalog is synced
    When the "failed-source" catalog is synced
    Then I see 3 deployments of app "ledger" in "prod"

  Scenario: Health is unknown until a check runs
    Given the "multi-instance" catalog is synced
    Then "ledger-api" on "prod-eu" has health "healthy"
    And "ledger-worker" on "prod-eu" has health "unknown"

  Scenario: Endpoints are sanitized and optional
    Given the "endpoints" catalog is synced
    Then "shop-api" on "prod-eu" has 2 endpoints
    And "shop-api" on "prod-eu" endpoint "ui" is "https://shop.example.com"
    And "shop-api" on "prod-eu" endpoint "health" is "https://shop.example.com/health"
    And "shop-worker" on "prod-eu" has 0 endpoints

  Scenario: An app with no components is listed
    Given the "empty-app" catalog is synced
    Then app "link-only" has 0 deployments

  Scenario: Replace-in-scope leaves other scopes untouched
    Given the "scope-a" catalog is synced
    And the "scope-b" catalog is synced
    Then I see 2 deployments in total
    When the "scope-a-reduced" catalog is synced
    Then I see 1 deployment in total
    And "ledger-api" on "prod-us" runs "b-version"

  Scenario: Timeout states depend on the checker
    Given the "timeout-test" catalog is synced
    Then "timeout-unknown" on "prod-eu" has health "unknown"
    And "timeout-down" on "prod-eu" has health "down"
