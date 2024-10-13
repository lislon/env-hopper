import { ItemWithSection } from './section-splitting';
import { UseComboboxPropGetters } from 'downshift';
import { Item } from './common';
import { Suggestion } from './Suggestion';
import React from 'react';
import { AutoCompleteProps } from './EhAutoComplete';
import { Section } from '../Section';

export interface ItemsSectionProps {
  items: ItemWithSection[];
  highlightedIndex: number;
  selectedItem: ItemWithSection | null;
  getItemProps: UseComboboxPropGetters<Item>['getItemProps'];
  autoCompleteProps: AutoCompleteProps;
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

  const shouldSplitAutocompleteBySections =
    recentSection.length > 0 || favSection.length > 0;

  return shouldSplitAutocompleteBySections ? (
    <SplitBySections
      allSection={allSection}
      favSection={favSection}
      recentSection={recentSection}
      {...rest}
    />
  ) : (
    <SingleSection allSection={allSection} {...rest} />
  );
}

export interface ItemWithSectionAndIndex extends ItemWithSection {
  index: number;
}

export interface SplitBySectionsProps extends Omit<ItemsSectionProps, 'items'> {
  recentSection: ItemWithSectionAndIndex[];
  favSection: ItemWithSectionAndIndex[];
  allSection: ItemWithSectionAndIndex[];
}

export function SplitBySections({
  recentSection,
  favSection,
  allSection,
  ...rest
}: SplitBySectionsProps) {
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

export interface SingleSectionProp extends Omit<ItemsSectionProps, 'items'> {
  allSection: ItemWithSectionAndIndex[];
}

export function SingleSection({ allSection, ...rest }: SingleSectionProp) {
  return (
    <>
      {allSection.map((item) => (
        <Suggestion key={item.index} index={item.index} item={item} {...rest} />
      ))}
    </>
  );
}
