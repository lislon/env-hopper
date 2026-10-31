Feature: Release trains beside the form

  Next to the links for an application the tool shows its release trains: the
  one production runs now and the next two, each with the day and, when known,
  the time it goes out. That is the question people come with — "when is the
  next one, and what is live" — so it is all the widget shows at rest. The
  instructions ticket, the release notes and where a train already runs are one
  hover away.

  The dates come from more than one place and the places do not always agree:
  the tracker's release, the ticket that says how and when to release, the
  release-notes page. The tool never picks a winner silently. It shows the
  ticket's time when there is one, the tracker's day when there is not, and
  says so when another source names a different day.

  Background:
    Given the "vet clinic" catalog

  Scenario: Production's train and the next two are shown, nothing more
    Given the "Appointments" release trains are:
      | train | status   | tracker day | ticket time               |
      | A268  | released | 2026-09-29  |                           |
      | A269  | released | 2026-10-13  | 2026-10-13T18:00:00-07:00 |
      | A270  | planned  | 2026-10-27  | 2026-10-27T18:00:00-07:00 |
      | A271  | planned  | 2026-11-10  |                           |
      | A272  | planned  | 2026-11-24  |                           |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then the release trains shown are "A269 / A270 / A271"
    And "A269" is marked "on prod"
    And "A270" is marked "next"
    And the "now" line sits between "A269" and "A270"

  Scenario: A train with a ticket shows its time and zone
    Given the "Appointments" release trains are:
      | train | status   | tracker day | ticket time               |
      | A269  | released | 2026-10-13  | 2026-10-13T18:00:00-07:00 |
      | A270  | planned  | 2026-10-27  | 2026-10-27T18:00:00-07:00 |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then "A270" goes out "Oct 27 · 6:00 PM PDT"

  Scenario: A train without a ticket shows only its day
    Given the "Appointments" release trains are:
      | train | status   | tracker day |
      | A269  | released | 2026-10-13  |
      | A271  | planned  | 2026-11-10  |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then "A271" goes out "Nov 10"

  Scenario: The zone follows the date, not today
    # Daylight saving ends between the two trains; each keeps its own zone.
    Given the "Appointments" release trains are:
      | train | status  | tracker day | ticket time               |
      | A270  | planned | 2026-10-27  | 2026-10-27T18:00:00-07:00 |
      | A271  | planned | 2026-11-10  | 2026-11-10T18:00:00-08:00 |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then "A270" goes out "Oct 27 · 6:00 PM PDT"
    And "A271" goes out "Nov 10 · 6:00 PM PST"

  Scenario: Nothing released yet still shows the next two
    Given the "Appointments" release trains are:
      | train | status  | tracker day |
      | A270  | planned | 2026-10-27  |
      | A271  | planned | 2026-11-10  |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then the release trains shown are "A270 / A271"
    And no train is marked "on prod"

  Scenario: An application without release trains shows no widget
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then I am shown no release trains at all

  Scenario: A tracker that cannot be read hides the widget, not the form
    Given the release trains for "Appointments" cannot be read
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then I am shown no release trains at all
    And the links offered are "staging status page / Source Code / VET issues"

  Scenario: Sources that name different days are flagged, not resolved
    Given the "Appointments" release trains are:
      | train | status  | tracker day | ticket time               | notes day  |
      | A270  | planned | 2026-10-27  | 2026-10-27T18:00:00-07:00 | 2026-10-28 |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then "A270" goes out "Oct 27 · 6:00 PM PDT"
    And "A270" is flagged "sources disagree"
    When I hover the "A270" release train
    Then its card says "Notes says Wed, Oct 28"

  Scenario: The ticket's time is not a disagreement with the tracker's day
    Given the "Appointments" release trains are:
      | train | status  | tracker day | ticket time               |
      | A270  | planned | 2026-10-27  | 2026-10-27T18:00:00-07:00 |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then "A270" is not flagged

  Scenario: Hovering a train shows its details and a way to open it
    Given the "Appointments" release trains are:
      | train | status  | tracker day | ticket time               | ticket  | notes url                      |
      | A270  | planned | 2026-10-27  | 2026-10-27T18:00:00-07:00 | VET-901 | https://wiki.example.test/A270 |
    And "A270" of "Appointments" already runs on "staging / qa-2"
    When I pick the "staging" environment
    And I pick the "Appointments" application
    And I hover the "A270" release train
    Then its card says "Tue, Oct 27 · 6:00 PM PDT"
    And its card says it runs on "A270-build: staging, qa-2"
    And its card links "A270-build" to "https://ci.example.test/builds/A270"
    And its card links "VET-901" to "https://tracker.example.test/browse/VET-901"
    And its card links "Release notes" to "https://wiki.example.test/A270"
    And its card links "Release contents" to "https://tracker.example.test/releases/A270"

  Scenario: The current environment stands out in "deployed on"
    Given the "Appointments" release trains are:
      | train | status   | tracker day |
      | A269  | released | 2026-10-13  |
    And "A269" of "Appointments" already runs on "production / staging"
    When I pick the "staging" environment
    And I pick the "Appointments" application
    And I hover the "A269" release train
    Then its card highlights "staging"

  Scenario: A train on many environments shows the ones that matter first
    # The current environment, then production, then the rest; the tail waits behind a toggle.
    Given the "Appointments" release trains are:
      | train | status   | tracker day |
      | A269  | released | 2026-10-13  |
    And "A269" of "Appointments" already runs on "qa-1 / qa-2 / qa-3 / production / qa-4 / staging / qa-5 / qa-6"
    When I pick the "staging" environment
    And I pick the "Appointments" application
    And I hover the "A269" release train
    Then its card says it runs on "A269-build: staging, production, qa-1, qa-2, qa-3, qa-4"
    And its card offers "+2 more"
    When I show every environment on its card
    Then its card says it runs on "A269-build: staging, production, qa-1, qa-2, qa-3, qa-4, qa-5, qa-6"

  Scenario: Each build is named once, with the environments that run it
    # Four environments on one build used to repeat that build four times.
    Given the "Appointments" release trains are:
      | train | status   | tracker day |
      | A269  | released | 2026-10-13  |
    And "A269" of "Appointments" runs as "main-901" on "production / qa-1"
    And "A269" of "Appointments" also runs as "hotfix-905" on "staging"
    When I pick the "staging" environment
    And I pick the "Appointments" application
    And I hover the "A269" release train
    Then its card says it runs on "hotfix-905: staging / main-901: production, qa-1"
    And its card links "main-901" to "https://ci.example.test/builds/main-901"
    And its card links "0123456" to "https://git.example.test/-/commit/0123456789abcdef"

  Scenario: An upcoming train links the branch it is cut to
    Given the "Appointments" release trains are:
      | train | status   | tracker day | branch                  |
      | A269  | released | 2026-10-13  |                         |
      | A270  | planned  | 2026-10-27  | release/maintenance_270 |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    And I hover the "A270" release train
    Then its card links "release/maintenance_270" to "https://git.example.test/vet/appointments/-/tree/release/maintenance_270"
