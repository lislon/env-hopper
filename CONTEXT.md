# Env Hopper

Env Hopper takes a user from "this app, in this environment" to the right URL, and tells them what is running there. Where the Backstage software catalog has a term, this glossary uses it.

## Catalog

**App**:
What the user picks and jumps into, thought of as one thing, made of zero or more Components. An App with none is links only, such as a vendor tool nobody here builds.
_Avoid_: System, application suite, product

**Component**:
A piece of software built and deployed on its own, belonging to one App.
_Avoid_: Service, module, deployable module

## Environments

**Environment**:
A stage the user picks (`dev`, `prod`), the same name for every App, however many places it physically spans. Which Deployment Targets it groups is up to the Entity Provider.
_Avoid_: Virtual environment, env profile

**Deployment Target**:
One physical place a Component runs, such as a specific account, cluster or namespace, with its own values (hosts, monitoring names) that links are built from. It is identified by the place itself, not by what a Source calls it, so two names for one namespace are one Deployment Target. Many Deployment Targets make up one Environment, and one Component may run on several of them, such as one instance per product line; the user picks the Environment, not the Target.
_Avoid_: Location (a different thing in Backstage), physical environment

**Retired Deployment Target**:
A Deployment Target being moved away from, still reported while the move lasts. Where one Deployment per Component per Environment is shown, a live Deployment Target wins over a retired one.

## Deployments

**Artifact**:
One built version of a Component, identified by its Version.
_Avoid_: Image (a Build produces Artifacts)

**Version**:
The exact, human-readable name of one Artifact, unique within its Component (e.g. `main-1234`). The Entity Provider derives it from whatever its Sources report, such as a pipeline id or a file name.
_Avoid_: Build number, version signal

**Version Alias**:
Another name an Artifact is known by (e.g. `2.4.0`, `spring-train`). Unlike a Version, an alias may name many Artifacts; on its own it means the most recently built of them.
_Avoid_: Tag, label, nickname

**Release**:
Where an Artifact came from: the tag, commit, author and date that produced it. One Release may produce Artifacts of several Components; an Artifact may have none.
_Avoid_: Version (for this meaning)

**Release Train**:
A named, dated delivery an App's work is planned into (e.g. `Maintenance 271`), read from a tracker. It is released or planned, and its date may be read from several Sources that disagree; every Release Date is kept.
_Avoid_: Release (that is where an Artifact came from), milestone

**Release Date**:
When one Source says a Release Train goes out: a day (`2026-10-27`), or a day and time with offset (`2026-10-27T18:00:00-07:00`) when that Source knows the time.
_Avoid_: Deploy date

**Deployment**:
The Artifact a Component last deployed successfully to a Deployment Target, and so is running there now. Only the current state exists; there is one Deployment per Component per Deployment Target.
_Avoid_: Rollout, install

**Repository**:
Where a Component's code is kept, identified by its Source's id (e.g. `gitlab:42`). Repository, Commit, Build, Tag, Change Request, Work Item and Declared Version are delivery facts: written once, never changed by a sync (ADR 0007).
_Avoid_: Project, repo

**Commit**:
One state of a Repository's code, identified by its sha.
_Avoid_: Revision, changeset

**Build**:
One CI run that may produce Artifacts, from one Commit of a branch, a Tag or a Change Request.
_Avoid_: Pipeline, workflow run, job

**Tag**:
A name on a Commit, maybe published as a release with a title.
_Avoid_: Label, Version Alias

**Change Request**:
A proposed change merged into a branch, with its title, branches and the Commit that merged it.
_Avoid_: Merge request, pull request, MR, PR

**Work Item**:
A tracker ticket a Change Request names (e.g. `jira:SHOP-7`). Kept as last read: a newer read replaces it.
_Avoid_: Issue, ticket, story

**Declared Version**:
A version a Commit declares about itself, one per type (e.g. `maven`, `npm`), or that it declares none.
_Avoid_: Version file

**User**:
A person a Source names, such as whoever deployed a Deployment, identified by username. A User is not an account that signs in to Env Hopper.
_Avoid_: Account, login, author

**Endpoint**:
A URL where one Deployment can be reached, with a kind (`ui`, `api`, `docs`, `health`, `other`) and an optional label. A Deployment has zero or more; a background worker has none.
_Avoid_: Link, page, jump (those are the hand-written URL templates)

**Health**:
The last observed condition of a Deployment: `healthy`, `degraded`, `down` or `unknown`, with when and by which Health Check it was seen. Only the current Health exists.
_Avoid_: Status (that is whether a deploy succeeded)

**Health Check**:
How the Health of a Deployment is determined, configured per Component: for example a request to its `health` Endpoint, or the readiness a cluster reports. A Component with no Health Check is `unknown`.
_Avoid_: Probe, monitor, ping

## Relationships

```mermaid
erDiagram
  APP ||--o{ COMPONENT : "is made of"
  ENVIRONMENT |o--|{ DEPLOYMENT_TARGET : "spans"
  COMPONENT ||--o{ ARTIFACT : "is built as"
  ARTIFACT }o--o| RELEASE : "came from"
  ARTIFACT }o--o{ VERSION_ALIAS : "is also known as"
  DEPLOYMENT }o--|| COMPONENT : "of"
  DEPLOYMENT }o--|| DEPLOYMENT_TARGET : "on"
  DEPLOYMENT }o--|| ARTIFACT : "runs"
  DEPLOYMENT }o--o| USER : "was deployed by"
  DEPLOYMENT ||--o{ ENDPOINT : "is reached at"
  DEPLOYMENT ||--o| HEALTH : "is observed as"
  COMPONENT ||--o{ HEALTH_CHECK : "is checked by"
  BUILD ||--o{ ARTIFACT : "produces"
  COMMIT ||--o{ BUILD : "is built by"
  COMMIT ||--o{ TAG : "is named by"
  COMMIT |o--o| CHANGE_REQUEST : "was merged by"
  CHANGE_REQUEST }o--o{ WORK_ITEM : "names"
  COMMIT ||--o{ DECLARED_VERSION : "declares"
```

- A Deployment is unique per Component and Deployment Target. Which Environment it is in follows from its Deployment Target; a Deployment Target in no Environment is never offered to the user.
- An Entity Provider combines one or more Sources and is the only writer of everything above.

## Integration

**Entity Provider**:
Deployment-specific code that feeds Environments, Apps, Components and Deployments into the catalog, and decides how its Sources combine when they disagree.
_Avoid_: Connector, discovery strategy

**Source**:
A package that reads one kind of infrastructure and returns neutral records about it, without deciding which App, Component or Environment they belong to. One Entity Provider combines several Sources.
_Avoid_: Adapter, plugin, module
