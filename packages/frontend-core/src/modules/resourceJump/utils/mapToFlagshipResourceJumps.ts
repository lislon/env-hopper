import type {
  ResourceJump,
  ResourceJumpGroup,
  ResourceJumpsData
} from '@env-hopper/backend-core';
import { alphabetical, objectify } from 'radashi';


export interface FlagshipResourceJumpUi {
  slug: string
  displayName: string;
  resourceJumps: Array<ResourceJump>;
}

export function mapToFlagshipResourceJumps(data: Pick<ResourceJumpsData, 'groups' | 'resourceJumps'>): Array<FlagshipResourceJumpUi> {
  const flagships: Array<FlagshipResourceJumpUi> = [];

  const bySlug = objectify(data.resourceJumps, j => j.slug);
  const hasGroupedSlugs = new Set<string>();

  for (const group of (data.groups || [])) {

    flagships.push({
      slug: group.slug,
      displayName: group.displayName,
      resourceJumps: group.resourceSlugs.map(slug => bySlug[slug]!)
    });

    for (const slug of group.resourceSlugs) {
      hasGroupedSlugs.add(slug);
    }
  }

  for (const resource of data.resourceJumps) {
    if (!hasGroupedSlugs.has(resource.slug)) {
      flagships.push({
        slug: resource.slug,
        displayName: resource.displayName,
        resourceJumps: [resource]
      });
    }
  }

  alphabetical(flagships, g => g.displayName.toLowerCase());

  return flagships;
}

export function getPrimaryResourceSlug(
  group: ResourceJumpGroup
): string | undefined {
  return group.resourceSlugs[0];
}

export function getChildResourceSlugs(group: ResourceJumpGroup): Array<string> {
  return group.resourceSlugs.slice(1);
}

export function getGroupedResourceSlugs(
  groups: Array<ResourceJumpGroup> | undefined
): Set<string> {
  const slugs = new Set<string>();
  if (groups) {
    for (const group of groups) {
      for (const slug of group.resourceSlugs) {
        slugs.add(slug);
      }
    }
  }
  return slugs;
}

export function getUngroupedResources(
  resources: Array<ResourceJump>,
  groups: Array<ResourceJumpGroup> | undefined
): Array<ResourceJump> {
  const groupedSlugs = getGroupedResourceSlugs(groups);
  return resources.filter((r) => !groupedSlugs.has(r.slug));
}
