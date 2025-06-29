export interface EhEnvDto {
  slug: string;
  displayName: string;
}

export interface EhAppDto {
  slug: string;
  displayName: string;
}

export interface EhAppPage {
  slug: string;
  displayName: string;
}

// Base interface for dropdown content components
export interface BaseDropdownContentProps {
  searchValue?: string;
  onSelect?: (value: string) => void;
  getMenuProps?: () => any;
  getItemProps?: (options: any) => any;
  highlightedIndex?: number;
  isOpen?: boolean;
  isUntouched: boolean;
} 