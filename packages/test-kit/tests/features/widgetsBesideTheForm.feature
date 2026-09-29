Feature: What is shown beside the form for the chosen environment

  Picking an environment and an application is only half of what someone came
  for. Beside the form the tool shows what that pair means in practice: the
  shared login the app's own screen asks for, the database behind it, and the
  handful of links a person would otherwise go and look up — the repository, the
  status page, the issue tracker.

  All of it is derived, never listed. Every value is a template over what the
  environment and the application each declare, and a value that cannot be
  resolved is not shown at all. That single rule is what makes the panel differ
  per environment, and it is why these scenarios assert absence as carefully as
  presence: a widget quietly missing and a widget quietly showing the wrong
  environment's details look identical to a test that only counts what rendered.

  The case that matters most is production. A shared login and a read-only
  database url are exactly what somebody needs on a throwaway environment and
  exactly what they must not be handed for the live one — so production says so
  in the payload rather than relying on anyone remembering.

  Background:
    Given the "vet clinic" catalog

  Scenario: On staging the shared login and the database are both to hand
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then I am shown the login "reception@vet.example"
    And its password is hidden until I ask for it
    And I am shown the database "jdbc:postgresql://db-staging-1:5432/appointments"

  Scenario: On production neither the login nor the database is offered
    When I pick the "production" environment
    And I pick the "Appointments" application
    Then I am shown no login at all
    And I am shown no database at all

  Scenario: Production withholds them rather than guessing at them
    # Production is reached at a fixed host, so it declares no host pattern of
    # its own. Were the widgets shown anyway they could only render the pattern
    # they failed to fill in — which reads as a real connection string and is
    # not one. Staging is the control: the same app, the same widgets, resolved.
    When I pick the "production" environment
    And I pick the "Appointments" application
    Then I am shown no database at all
    When I pick the "staging" environment
    Then I am shown the database "jdbc:postgresql://db-staging-1:5432/appointments"

  Scenario: An application with no login of its own shows none on any environment
    When I pick the "staging" environment
    And I pick the "Treat Shop" application
    Then I am shown no login at all
    And I am shown no database at all

  Scenario: The links offered are the ones whose url the selection completes
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then the links offered are "staging status page / Source Code / VET issues"
    And the "Source Code" link goes to "https://git.example.test/vet/appointments"
    And the "staging status page" link goes to "https://status.example.test/staging"
    And the "VET issues" link goes to "https://tracker.example.test/browse/VET"

  Scenario: A link naming something the application has not got is not offered
    When I pick the "staging" environment
    And I pick the "Treat Shop" application
    Then the links offered are "staging status page"

  Scenario: Production's own links follow its restated details
    # The same three links, but the repository is production's, not the app's
    # default — the environment restates it, so everything built from it follows.
    When I pick the "production" environment
    And I pick the "Appointments" application
    Then the links offered are "production status page / Source Code / VET issues"
    And the "Source Code" link goes to "https://git.example.test/vet/appointments-released"
    And the "production status page" link goes to "https://status.example.test/live"
