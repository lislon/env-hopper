import { SectionedItem } from './section-splitting';
import { UseComboboxPropGetters } from 'downshift';
import { SAME_SECTION_MIN_ITEMS, SourceItem } from './common';
import { Suggestion } from './Suggestion';
import React from 'react';
import { EhAutoCompleteProps } from './EhAutoComplete';
import { Section } from '../Section';

export interface ItemsSectionProps {
  items: SectionedItem[];
  highlightedIndex: number;
  selectedItem: SectionedItem | null;
  getItemProps: UseComboboxPropGetters<SourceItem>['getItemProps'];
  autoCompleteProps: EhAutoCompleteProps;
  tmpSameSubstitutionTitle?: string;
}

export function ItemsSections({ items, ...rest }: ItemsSectionProps) {
  const itemsWithIndex = items.map((item, index) => ({ ...item, index }));

  const recentSection = itemsWithIndex.filter(
    (item) => item.section === 'recent',
  );
  const favSection = itemsWithIndex.filter(
    (item) => item.section === 'favorite',
  );
  const sameSubSection = itemsWithIndex.filter(
    (item) => item.section === 'same_substitution',
  );

  const allSection = itemsWithIndex.filter((item) => item.section === 'all');

  const shouldSplitAutocompleteBySections =
    recentSection.length > 0 ||
    favSection.length > 0 ||
    sameSubSection.length > 0;

  return shouldSplitAutocompleteBySections ? (
    <SplitBySections
      allSection={allSection}
      favSection={favSection}
      recentSection={recentSection}
      sameSubSection={sameSubSection}
      {...rest}
    />
  ) : (
    <SingleSection allSection={allSection} {...rest} />
  );
}

export interface ItemWithSectionAndIndex extends SectionedItem {
  index: number;
}

export interface SplitBySectionsProps extends Omit<ItemsSectionProps, 'items'> {
  recentSection: ItemWithSectionAndIndex[];
  favSection: ItemWithSectionAndIndex[];
  sameSubSection: ItemWithSectionAndIndex[];
  allSection: ItemWithSectionAndIndex[];
}

export function SplitBySections({
  recentSection,
  favSection,
  sameSubSection,
  allSection,
  tmpSameSubstitutionTitle,
  ...rest
}: SplitBySectionsProps) {
  return (
    <>
      {recentSection.length > 0 && (
        <Section title={'🕒 Recent'} testId="recentSection">
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
        <Section title={'⭐ Favorites'} testId="favoriteSection">
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
      {sameSubSection.length > SAME_SECTION_MIN_ITEMS && (
        <Section
          title={'⛓️ ' + tmpSameSubstitutionTitle}
          testId="sameSubSection"
        >
          {sameSubSection.map((item) => (
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
        <Section title={'🗂️ All'} testId="allSection">
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
