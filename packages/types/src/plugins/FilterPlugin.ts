export interface FilterPlugin {
  name: string;
  extendTypeDefs?: (typeDefs: string[]) => string[];
  extendResolvers?: (resolvers: any) => any;
} 