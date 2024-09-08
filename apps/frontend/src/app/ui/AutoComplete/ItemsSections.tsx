import { ItemWithSection } from './section-splitting';
import { UseComboboxPropGetters } from 'downshift';
import { Item } from './common';
import { Section } from '../Section';
import { Suggestion } from './Suggestion';
import React from 'react';
import { AutoCompleteProps } from './EhAutoComplete';

export interface ItemsSectionProps {
  items: ItemWithSection[];
  highlightedIndex: number;
  selectedItem: ItemWithSection | null;
  getItemProps: UseComboboxPropGetters<Item>['getItemProps'];
  autoCompleteProps: AutoCompleteProps;
  tmpFavorite: Map<string, boolean>;
  setTmpFavorite: (tmpFavorite: Map<string, boolean>) => void;
}

export function ItemsSections({ items, ...rest }: ItemsSectionProps) {
  const itemsWithIndex = items.map((item, index) => ({ ...item, index }));

  const recentSection = itemsWithIndex.filter(
    (item) => item.section === 'recent',
  );
  const favSection = itemsWithIndex.filter(
    (item) => item.section === 'favorite',
  );
  const allSection = itemsWithIndex.filter((item) => item.section === 'all');

  return (
    <>
      {recentSection.length > 0 && (
        <Section title={'🕒 Recent'} id="recent">
          {recentSection.map((item) => (
            <Suggestion
              key={item.index}
              index={item.index}
              item={item}
              {...rest}
            />
          ))}
        </Section>
      )}
      {favSection.length > 0 && (
        <Section title={'⭐ Favorites'} id="favorites">
          {favSection.map((item) => (
            <Suggestion
              key={item.index}
              index={item.index}
              item={item}
              {...rest}
            />
          ))}
        </Section>
      )}
      {allSection.length > 0 && (
        <Section title={'🗂️ All'} id="all">
          {allSection.map((item) => (
            <Suggestion
              key={item.index}
              index={item.index}
              item={item}
              {...rest}
            />
          ))}
        </Section>
      )}
    </>
  );
}
