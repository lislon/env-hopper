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
