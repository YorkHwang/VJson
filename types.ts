
// Fix: Import React to use React.MouseEvent in type definitions
import React from 'react';
import { Language } from './translations';

export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

export interface JsonNodeProps {
  name: string | number;
  value: JsonValue;
  depth: number;
  isLast?: boolean;
  onCopyPath: (path: string) => void;
  currentPath: string;
  searchTerm: string;
  t: any;
  onContextMenu: (e: React.MouseEvent, data: { key: string; value: string; path: string }) => void;
  initialExpanded?: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  content: string;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  key: string;
  value: string;
  path: string;
}