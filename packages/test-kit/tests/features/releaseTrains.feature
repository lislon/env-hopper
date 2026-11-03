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
    And its card says it runs on "staging: A270-build / qa-2: A270-build"
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
    Then its card says it runs on "staging: A269-build / production: A269-build / qa-1: A269-build / qa-2: A269-build / qa-3: A269-build / qa-4: A269-build / qa-5: A269-build"
    And its card offers "+1 more"
    When I show every environment on its card
    Then its card says it runs on "staging: A269-build / production: A269-build / qa-1: A269-build / qa-2: A269-build / qa-3: A269-build / qa-4: A269-build / qa-5: A269-build / qa-6: A269-build"

  Scenario: Sorted by build, each build is named once above the environments running it
    Given the "Appointments" release trains are:
      | train | status   | tracker day |
      | A269  | released | 2026-10-13  |
    And "A269" of "Appointments" runs as "main-901" on "production / qa-1"
    And "A269" of "Appointments" also runs as "hotfix-905" on "staging"
    When I pick the "staging" environment
    And I pick the "Appointments" application
    And I hover the "A269" release train
    And I sort the card's environments "By build"
    Then its card says it runs on "staging: hotfix-905 / production: main-901 / qa-1: main-901"
    And its card links "main-901" to "https://ci.example.test/builds/main-901"
    And its card links "0123456" to "https://git.example.test/-/commit/0123456789abcdef"

  Scenario: An upcoming train is a release candidate once its branch is cut, else on the main line
    Given the "Appointments" release trains are:
      | train | status   | tracker day | line                    | line kind   |
      | A269  | released | 2026-10-13  |                         |             |
      | A270  | planned  | 2026-10-27  | release/maintenance_270 | release     |
      | A271  | planned  | 2026-11-10  | develop                 | integration |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then "A270" is marked "rc"
    And "A271" is marked "develop"
    When I hover the "A270" release train
    Then its card links "release/maintenance_270" to "https://git.example.test/vet/appointments/-/tree/release/maintenance_270"

  Scenario: A build of the train's branch runs the train, whatever version it is called
    # The tracker's version (3.140.0.0) is on none of them; their branch is.
    Given the "Appointments" release trains are:
      | train | status  | tracker day | line                    |
      | A272  | planned | 2026-11-10  | release/maintenance_272 |
    And the "Appointments" builds running are:
      | env     | build                | aliases                         | commit |
      | staging | RC3-7003             | release/maintenance_272-7003    | c3     |
      | qa-1    | release-maintenance-272-7001 |                         | c1     |
      | qa-2    | develop-6999         |                                 | c0     |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    And I hover the "A272" release train
    Then its card says it runs on "staging: RC3-7003 / qa-1: release-maintenance-272-7001"

  Scenario: Each environment shows how far its build is behind the tip of the train's branch
    Given the "Appointments" release trains are:
      | train | status  | tracker day | line                    | tip                          | tip commit |
      | A272  | planned | 2026-11-10  | release/maintenance_272 | release-maintenance-272-7004 | c4         |
    And the "Appointments" builds running are:
      | env     | build                        | commit |
      | qa-1    | release-maintenance-272-7001 | c1     |
      | staging | release-maintenance-272-7003 | c3     |
      | qa-2    | release-maintenance-272-7004 | c4     |
      | qa-3    | release-maintenance-272-7003 | c3     |
    And on "release/maintenance_272" of "Appointments", commits are behind its tip by:
      | commit | behind |
      | c4     | 0      |
      | c3     | 2      |
      | c1     | 6      |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    And I hover the "A272" release train
    Then its card links "release-maintenance-272-7004" to "https://ci.example.test/builds/release-maintenance-272-7004"
    And its card says it runs on "staging: release-maintenance-272-7003 (−2) / qa-1: release-maintenance-272-7001 (−6) / qa-2: release-maintenance-272-7004 (tip) / qa-3: release-maintenance-272-7003 (−2)"
    And its card calls out "qa-1" as far behind
    When I sort the card's environments "By build"
    Then its card says it runs on "qa-2: release-maintenance-272-7004 (tip) / staging: release-maintenance-272-7003 (−2) / qa-3: release-maintenance-272-7003 / qa-1: release-maintenance-272-7001 (−6)"

  Scenario: A hotfix is a row of its own, and is on prod once deployed
    Given the "Appointments" release trains are:
      | train | status   | tracker day | kind   | patches |
      | A271  | released | 2026-10-27  |        |         |
      | HF167 | released | 2026-10-30  | hotfix | A271    |
      | HF168 | planned  | 2026-11-05  | hotfix | A271    |
      | A272  | planned  | 2026-11-10  |        |         |
      | A273  | planned  | 2026-11-24  |        |         |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    Then the release trains shown are "A271 / HF167 / HF168 / A272 / A273"
    And "HF167" is marked "on prod"
    And "HF168" is marked "hotfix"
    And the "now" line sits between "HF167" and "HF168"
    When I hover the "HF168" release train
    Then its card says "on top of A271"

  Scenario: An upcoming hotfix warns while the next train's branch lacks its commits
    Given the "Appointments" release trains are:
      | train | status   | tracker day | kind   | line                    | line kind | tip       | tip commit |
      | A271  | released | 2026-10-27  |        |                         |           |           |            |
      | HF168 | planned  | 2026-11-05  | hotfix | release/hotfix-168      | hotfix    | hf-168-2  | h2         |
      | A272  | planned  | 2026-11-10  |        | release/maintenance_272 | release   | rc-272-4  | c4         |
    And on "release/hotfix-168" of "Appointments", commits are behind its tip by:
      | commit | behind |
      | c4     | 2      |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    And I hover the "HF168" release train
    Then its card says "Not in release/maintenance_272 yet: 2 commits to merge forward"

  Scenario: Production never runs an unreleased train, even on the main line it is built from
    # An App released from master: production's master build belongs to the train already out.
    Given the "Appointments" release trains are:
      | train | status   | tracker day | line   | line kind   |
      | A271  | released | 2026-10-27  |        |             |
      | A272  | planned  | 2026-11-10  | master | integration |
    And the "Appointments" builds running are:
      | env        | build       | commit |
      | production | master-6001 | m1     |
      | staging    | master-6005 | m5     |
    When I pick the "staging" environment
    And I pick the "Appointments" application
    And I hover the "A272" release train
    Then its card says it runs on "staging: master-6005"
