import React, { MouseEventHandler } from 'react';
import cn from 'classnames';
import { FavoriteButton } from '../FavoriteButton';
import { Item, suggestionHeightClass } from './common';
import { UseComboboxPropGetters } from 'downshift';
import { AutoCompleteProps } from './EhAutoComplete';

export interface SuggestionProps {
  index: number;
  item: Item;
  highlightedIndex: number;
  selectedItem: Item | null;
  getItemProps: UseComboboxPropGetters<Item>['getItemProps'];
  autoCompleteProps: AutoCompleteProps;
  tmpFavorite: Map<string, boolean>;
  setTmpFavorite: (tmpFavorite: Map<string, boolean>) => void;
}

export function Suggestion({
  item,
  index,
  highlightedIndex,
  selectedItem,
  getItemProps,
  autoCompleteProps,
  tmpFavorite,
  setTmpFavorite,
}: SuggestionProps) {
  const onClick: MouseEventHandler = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const wasFavorite =
      tmpFavorite.get(item.id) !== undefined
        ? tmpFavorite.get(item.id)
        : item.favorite;
    tmpFavorite.set(item.id, !wasFavorite);
    setTmpFavorite(new Map(tmpFavorite));
    autoCompleteProps.onFavoriteToggle?.(item, !wasFavorite);
  };
  const isTmpFavorite = tmpFavorite.get(item.id);
  const isFavorite =
    isTmpFavorite !== undefined ? isTmpFavorite : item.favorite;
  return (
    <div
      className={cn(
        'group',
        highlightedIndex === index && 'bg-gray-100 dark:bg-gray-700',
        selectedItem === item && 'font-bold',
        `${suggestionHeightClass} px-3 [&:not(:last-child)]:border-b border-b-gray-100 dark:border-b-gray-600 flex justify-between items-center`,
      )}
      {...getItemProps({ item, index })}
    >
      <div>{item.title}</div>
      <FavoriteButton
        isSelected={isFavorite}
        className={isFavorite ? '' : 'invisible group-hover:visible'}
        title={
          isFavorite
            ? `Remove ${item.title} from favorites`
            : `Add ${item.title} to favorites`
        }
        onClick={onClick}
      />
      {/*<ShortcutLink {...autoCompleteProps} item={item} />*/}
    </div>
  );
}
