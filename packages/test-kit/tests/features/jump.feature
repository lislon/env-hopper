Feature: Jumping to a resource in a chosen environment

  The whole point of the tool is to answer "same page, other environment". A
  person holds two things in their head — which environment they mean, and which
  page of which app they want — and the tool's job is to turn that pair into one
  url. Some urls need a third thing the person has to supply, like the id of the
  order they are looking at; those stay unresolved until they type it.

  Every url the tool can produce is also a url someone can paste to a colleague,
  so an address has to carry the whole selection: land on it and the same jumps
  come back. That is what these scenarios pin down, because it is the part that
  must survive the UI being replaced — the address vocabulary is the contract,
  the widgets around it are not.

  Choosing the environment and the resource is expressed here as landing on an
  address rather than as clicking a picker, because today there is no picker to
  click: the environments catalog renders as a table of rows nothing links to,
  and the home page's resource links resolve to "/" until an environment is
  known. When the ported UI brings a real picker back, these scenarios gain
  `When I pick ...` steps and keep every Then below unchanged.

  Background:
    Given the "car shop" catalog on the replacement UI

  Scenario: The catalog the tool was given is the catalog it offers
    Then the resources listed are "Service Booking / Parts Inventory / Fleet Dashboard"

  Scenario: Every environment in the catalog is on offer
    Given the "car shop" catalog on the replacement UI opened at "/envs"
    Then the environments listed are "dev / staging / prod"

  Scenario: An environment and a resource resolve to one jump url
    Given the "car shop" catalog on the replacement UI opened at "/env/dev/app/parts-inventory"
    Then the trail includes "Dev / Parts Inventory"
    And the "Parts Inventory" jump goes to "http://localhost:4000/env/dev/app/parts-inventory"

  Scenario: The same resource in another environment is a different jump
    Given the "car shop" catalog on the replacement UI opened at "/env/staging/app/parts-inventory"
    Then the "Parts Inventory" jump goes to "http://localhost:4000/env/staging/app/parts-inventory"

  Scenario: A pasted address brings back the whole selection
    Given the "car shop" catalog on the replacement UI opened at "/env/prod/app/fleet-dashboard"
    Then the address bar shows "/env/prod/app/fleet-dashboard"
    And the trail includes "Prod / Fleet Dashboard"
    And the "Fleet Dashboard" jump goes to "http://localhost:4000/env/prod/app/fleet-dashboard"

  Scenario: A resource with several pages offers each of them
    Given the "car shop" catalog on the replacement UI opened at "/env/dev/app/service-booking"
    Then the jumps offered are "Service Booking / Order Details"

  Scenario: A url that needs an id stays unresolved until one is typed
    Given the "car shop" catalog on the replacement UI opened at "/env/dev/app/service-booking"
    Then the "Order Details" jump goes to "http://localhost:4000/env/dev/app/service-booking/order/{{orderId}}"
    When I fill in "Order ID" with "8002"
    Then the "Order Details" jump goes to "http://localhost:4000/env/dev/app/service-booking/order/8002"
    And the "Service Booking" jump goes to "http://localhost:4000/env/dev/app/service-booking"
