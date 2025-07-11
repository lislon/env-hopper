import FlexSearch from 'flexsearch';
import { EhIndexData, EhAppDto, EhEnvDto } from '@env-hopper/backend-core';
import { useCallback, useState } from 'react';
import { useEhGlobalContextProps, useEhSearchIndexContext } from '~/contexts';


export function useEhCommandSearch() {

  
  const { appPageIndex, envIndex, userHistorySearchIndex, userInteractionsIndex } = useEhSearchIndexContext();
  const { indexData: { envs } } = useEhGlobalContextProps();
  
  const searchEnvs = useCallback((query: string, limit: number = 10): SearchResultItem[] => {
    
    
    if (!envIndex || !query.trim()) return [];
  
    
    
    const results = envIndex.search(query, { limit });
    return results.map((index) => {
      console.log(index);
      
      const env = envs[index];
      return {
        id: `app-${env.slug}`,
        type: 'app' as const,
        title: env.displayName,
        subtitle: env.abbr,
        description: env.tags?.join(', '),
        icon: 'Package',
        data: env,
      };
    });
  }, [appPageIndex]);

  return { searchEnvs };

}

// Search result types
export interface SearchResultItem {
  id: string;
  type: 'app' | 'env' | 'page';
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  data: any; // The original data object
}


// // Initialize search indexes
// export function initializeSearchIndexes(indexData: EhIndexData) {

//   envIndex = new FlexSearch.Index({
//     tokenize: 'forward',
//     resolution: 9,
//     depth: 3,
//   });

//   pageIndex = new FlexSearch.Index({
//     tokenize: 'forward',
//     resolution: 9,
//     depth: 3,
//   });

//   // Store data
//   appsData = Object.values(indexData.apps);
//   envsData = Object.values(indexData.envs);
//   pagesData = [];

//   // Index apps
//   Object.values(indexData.apps).forEach((app, index) => {
//     const searchText = `${app.displayName} ${app.slug} ${app.abbr || ''} ${app.tags?.join(' ') || ''}`;
//     appIndex.add(index, searchText);
//   });

//   // Index environments
//   Object.values(indexData.envs).forEach((env, index) => {
//     const searchText = `${env.displayName} ${env.slug}`;
//     envIndex.add(index, searchText);
//   });

//   // Index pages
//   let pageIndexCounter = 0;
//   Object.values(indexData.apps).forEach((app) => {
//     if (app.ui?.groups) {
//       app.ui.groups.forEach((group) => {
//         group.pages.forEach((page) => {
//           const searchText = `${page.title || page.slug} ${page.slug} ${page.tags?.join(' ') || ''} ${app.displayName} ${group.displayName}`;
//           pageIndex.add(pageIndexCounter, searchText);
//           pagesData.push({ app, page, group });
//           pageIndexCounter++;
//         });
//       });
//     }
//   });
// }

// // Search apps
// export function searchApps(query: string, limit: number = 10): SearchResultItem[] {
//   if (!appIndex || !query.trim()) return [];

//   const results = appIndex.search(query, { limit });
//   return results.map((index) => {
//     const app = appsData[index as number];
//     return {
//       id: `app-${app.slug}`,
//       type: 'app' as const,
//       title: app.displayName,
//       subtitle: app.abbr,
//       description: app.tags?.join(', '),
//       icon: 'Package',
//       data: app,
//     };
//   });
// }

// // Search environments
// export function searchEnvironments(query: string, limit: number = 10): SearchResultItem[] {
//   if (!envIndex || !query.trim()) return [];

//   const results = envIndex.search(query, { limit });
//   return results.map((index) => {
//     const env = envsData[index as number];
//     return {
//       id: `env-${env.slug}`,
//       type: 'env' as const,
//       title: env.displayName,
//       subtitle: env.slug,
//       description: getEnvironmentDescription(env.slug),
//       icon: getEnvironmentIcon(env.slug),
//       data: env,
//     };
//   });
// }

// // Search pages
// export function searchPages(query: string, limit: number = 10): SearchResultItem[] {
//   if (!pageIndex || !query.trim()) return [];

//   const results = pageIndex.search(query, { limit });
//   return results.map((index) => {
//     const { app, page, group } = pagesData[index as number];
//     return {
//       id: `page-${app.slug}-${page.slug}`,
//       type: 'page' as const,
//       title: page.title || page.slug,
//       subtitle: `${app.displayName} > ${group.displayName}`,
//       description: page.tags?.join(', '),
//       icon: 'FileText',
//       data: { app, page, group },
//     };
//   });
// }

// // Combined search function
// export function searchAll(query: string, limit: number = 20): SearchResultItem[] {
//   if (!query.trim()) return [];

//   const appResults = searchApps(query, Math.ceil(limit * 0.4));
//   const envResults = searchEnvironments(query, Math.ceil(limit * 0.3));
//   const pageResults = searchPages(query, Math.ceil(limit * 0.3));

//   // Combine and sort results
//   const allResults = [...appResults, ...envResults, ...pageResults];

//   // Simple scoring based on query match
//   return allResults
//     .map((result) => ({
//       ...result,
//       score: getSearchScore(result, query),
//     }))
//     .sort((a, b) => b.score - a.score)
//     .slice(0, limit);
// }

// // Helper functions
// function getEnvironmentDescription(slug: string): string {
//   if (slug.includes('prod')) return 'Production Environment';
//   if (slug.includes('preprod') || slug.includes('staging')) return 'Staging Environment';
//   if (slug.includes('dev') || slug.includes('int')) return 'Development Environment';
//   return 'Environment';
// }

// function getEnvironmentIcon(slug: string): string {
//   if (slug.includes('cross')) return 'Package';
//   if (slug.includes('prod')) return 'Globe';
//   return 'Server';
// }

// function getSearchScore(result: SearchResultItem, query: string): number {
//   const lowerQuery = query.toLowerCase();
//   let score = 0;

//   // Exact match in title gets highest score
//   if (result.title.toLowerCase().includes(lowerQuery)) {
//     score += 100;
//   }

//   // Match in subtitle
//   if (result.subtitle?.toLowerCase().includes(lowerQuery)) {
//     score += 50;
//   }

//   // Match at the beginning of title gets bonus
//   if (result.title.toLowerCase().startsWith(lowerQuery)) {
//     score += 50;
//   }

//   // Type-based scoring
//   if (result.type === 'app') score += 20;
//   if (result.type === 'env') score += 15;
//   if (result.type === 'page') score += 10;

//   return score;
// }
