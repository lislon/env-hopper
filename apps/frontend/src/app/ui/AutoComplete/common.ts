import { EhSubstitutionId } from '@env-hopper/types';

export interface SourceItem {
  id: string;
  title: string;
  favorite?: boolean;
  recent?: boolean;
  substitutionId?: EhSubstitutionId;
}

export const SAME_SECTION_MIN_ITEMS = 1;
