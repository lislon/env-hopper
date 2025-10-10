interface GridItem {
  slug: string
  displayName: string
  groupName: string | null
}

/**
 * Arranges items in a grid layout, preferring to place items from the same group
 * consecutively so they naturally flow into the same column in CSS Grid.
 *
 * @param items - Array of items to arrange
 * @param numRows - Number of rows in the grid
 * @param numCols - Number of columns in the grid
 * @returns Array of items in the order they should appear in the DOM
 */
export function arrangeGridItems(
  items: Array<GridItem>,
  numRows: number,
  numCols: number,
): Array<GridItem> {
  const totalSlots = numRows * numCols

  // Group items by their group name
  const groupedItems = new Map<string, Array<GridItem>>()
  const ungroupedItems: Array<GridItem> = []

  for (const item of items) {
    if (item.groupName) {
      if (!groupedItems.has(item.groupName)) {
        groupedItems.set(item.groupName, [])
      }
      const group = groupedItems.get(item.groupName)
      if (group) {
        group.push(item)
      }
    } else {
      ungroupedItems.push(item)
    }
  }

  const arranged: Array<GridItem> = []

  // Simple approach: place grouped items first (they'll naturally group in columns),
  // then fill with ungrouped items
  // Sort items so grouped items appear consecutively
  // Items from the same group should be placed together
  for (const [_, groupItems] of groupedItems.entries()) {
    for (const item of groupItems) {
      if (arranged.length >= totalSlots) break
      arranged.push(item)
    }
  }

  // Add remaining items
  for (const item of ungroupedItems) {
    if (arranged.length >= totalSlots) break
    arranged.push(item)
  }

  return arranged.slice(0, totalSlots)
}
