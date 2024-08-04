import React, { MouseEventHandler } from 'react';
import cn from 'classnames';
import { FavoriteButton } from '../FavoriteButton';
import { Item, suggestionHeightClass } from './common';
import { UseComboboxPropGetters } from 'downshift';
import { AutoCompleteProps } from './EhAutoComplete';
import { ShortcutLink } from './ShortcutLink';

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
        `${suggestionHeightClass} py-2 px-1 shadow-sm`,
        "before:content-['']"
      )}
      {...getItemProps({ item, index })}
    >
      <div className="flex justify-between px-1">
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
      </div>
      <ShortcutLink {...autoCompleteProps} item={item} />
    </div>
  );
}
