/** Screen ids as they appear in the .fig, plus the tap targets that connect them.
 *  Node ids are the design's own guids, so every hotspot sits exactly on the
 *  control the designer drew. */
export const S = {
  lists:      '1:2',
  nameList:   '1:1336',
  addItem:    '1:120',
  search:     '1:1260',
  ready:      '1:291',
  sort:       '1:708',
  share:      '1:1153',
  settings:   '1:810',
  shareList:  '1:923',
  permission: '1:1045',
  instore:    '1:480',
  instoreAlt: '1:598',
  done:       '1:187',
} as const;

export type Hotspot = { node: string; to: string; label: string };

export const HOTSPOTS: Record<string, Hotspot[]> = {
  [S.lists]: [
    { node: '1:27',   to: S.nameList, label: 'Create a list' },
    { node: '1:12',   to: S.ready,    label: 'Open Weekly Start' },
    { node: '1:9',    to: S.ready,    label: "Open Niyaz's List" },
  ],
  [S.nameList]: [
    { node: '1:1434', to: S.addItem,  label: 'Create' },
    { node: '1:1439', to: S.lists,    label: 'Close' },
  ],
  [S.addItem]: [
    { node: '1:185',  to: S.search,   label: 'Add an item to your list' },
  ],
  [S.search]: [
    { node: '1:1329', to: S.ready,    label: 'Add stok cold brew' },
    { node: '1:1322', to: S.addItem,  label: 'Cancel' },
  ],
  [S.ready]: [
    { node: '1:354',  to: S.lists,    label: 'Back' },
    { node: '1:368',  to: S.sort,     label: 'Sort by' },
    { node: '1:355',  to: S.share,    label: 'Share' },
    { node: '1:358',  to: S.settings, label: 'List settings' },
    { node: '1:375',  to: S.instore,  label: 'Shop in-store' },
  ],
  [S.sort]: [
    { node: '1:794',  to: S.ready,    label: 'View results' },
    { node: '1:803',  to: S.ready,    label: 'Close' },
  ],
  [S.share]: [
    { node: '1:1244', to: S.shareList, label: 'Shop together' },
    { node: '1:1250', to: S.shareList, label: 'Let them shop it' },
    { node: '1:1255', to: S.shareList, label: 'Share view only' },
    { node: '1:1240', to: S.ready,     label: 'Close' },
  ],
  [S.settings]: [
    { node: '1:907',  to: S.shareList, label: 'Manage Share List' },
    { node: '1:901',  to: S.ready,     label: 'Close' },
  ],
  [S.shareList]: [
    { node: '1:1025', to: S.permission, label: 'Yasamin' },
    { node: '1:1013', to: S.ready,      label: 'Close' },
  ],
  [S.permission]: [
    { node: '1:1131', to: S.shareList, label: 'Back' },
    { node: '1:1141', to: S.ready,     label: 'Close' },
  ],
  [S.instore]: [
    { node: '1:591',  to: S.instoreAlt, label: 'List view' },
  ],
  [S.instoreAlt]: [
    { node: '1:614',  to: S.instore,   label: 'Card view' },
    { node: '1:705',  to: S.done,      label: 'End trip' },
  ],
  [S.done]: [
    { node: '1:287',  to: S.lists,     label: 'Done' },
  ],
};

/** Sheets slide up over the screen behind them; everything else pushes across. */
export const SHEET_SCREENS = new Set<string>([S.nameList, S.sort, S.share, S.settings, S.shareList, S.permission]);
