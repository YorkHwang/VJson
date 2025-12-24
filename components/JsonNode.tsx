
import React, { useState, useMemo, useEffect } from 'react';
import { JsonNodeProps, JsonValue } from '../types';

const HighlightedText: React.FC<{ text: string; highlight: string; className?: string }> = ({ text, highlight, className }) => {
  if (!highlight.trim()) return <span className={className}>{text}</span>;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span className={className}>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() 
          ? <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5">{part}</mark> 
          : part
      )}
    </span>
  );
};

const JsonNode: React.FC<JsonNodeProps> = ({ 
  name, 
  value, 
  depth, 
  isLast, 
  onCopyPath, 
  currentPath, 
  searchTerm,
  t,
  onContextMenu,
  initialExpanded
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded ?? (depth < 2));
  
  // Update state if initialExpanded prop changes (used for Expand/Collapse All)
  useEffect(() => {
    if (initialExpanded !== undefined) {
      setIsExpanded(initialExpanded);
    }
  }, [initialExpanded]);

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const valueAsString = useMemo(() => {
    if (value === null) return 'null';
    return String(value);
  }, [value]);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, {
      key: String(name),
      value: valueAsString,
      path: currentPath
    });
  };

  const renderValue = () => {
    if (value === null) return <HighlightedText text="null" highlight={searchTerm} className="text-gray-400" />;
    if (typeof value === 'string') return (
      <span className="text-green-600">
        "<HighlightedText text={value} highlight={searchTerm} />"
      </span>
    );
    if (typeof value === 'number') return <HighlightedText text={value.toString()} highlight={searchTerm} className="text-blue-600" />;
    if (typeof value === 'boolean') return <HighlightedText text={value.toString()} highlight={searchTerm} className="text-orange-600" />;
    return null;
  };

  const getBracketOpen = () => isArray ? '[' : '{';
  const getBracketClose = () => isArray ? ']' : '}';

  const entries = isObject ? Object.entries(value as object) : isArray ? (value as any[]).map((v, i) => [i, v]) : [];

  const showName = name !== "" && name !== "__root__";

  return (
    <div className={`${depth === 0 ? '' : 'ml-4'} font-mono text-sm leading-relaxed`}>
      <div className="flex items-start group relative" onContextMenu={handleRightClick}>
        {isExpandable && (
          <button 
            onClick={toggleExpand}
            className="w-4 h-4 mt-1 mr-1 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        {!isExpandable && <div className="w-5" />}
        
        {showName && (
          <>
            <span 
              className="text-purple-700 font-semibold cursor-pointer hover:bg-purple-50 rounded px-0.5 transition-colors"
              onClick={() => onCopyPath(currentPath)}
            >
              {typeof name === 'number' ? name : (
                 <>
                   "<HighlightedText text={String(name)} highlight={searchTerm} />"
                 </>
              )}
            </span>
            <span className="mx-1 text-gray-500">:</span>
          </>
        )}
        
        {isExpandable ? (
          <>
            <span className="text-gray-600">{getBracketOpen()}</span>
            {!isExpanded && (
              <span 
                className="mx-1 px-1 bg-gray-100 rounded text-xs text-gray-400 cursor-pointer hover:bg-gray-200"
                onClick={toggleExpand}
              >
                ... {entries.length} {t.items}
              </span>
            )}
          </>
        ) : (
          <span>{renderValue()}{!isLast && <span className="text-gray-500">,</span>}</span>
        )}
      </div>

      {isExpandable && isExpanded && (
        <div className="border-l border-gray-200 ml-2 py-1">
          {entries.map(([key, val], idx) => (
            <JsonNode
              key={key}
              name={key}
              value={val as JsonValue}
              depth={depth + 1}
              isLast={idx === entries.length - 1}
              onCopyPath={onCopyPath}
              currentPath={isArray ? `${currentPath}[${key}]` : (currentPath === "$" ? `$["${key}"]` : `${currentPath}["${key}"]`)}
              searchTerm={searchTerm}
              t={t}
              onContextMenu={onContextMenu}
              initialExpanded={initialExpanded}
            />
          ))}
        </div>
      )}

      {isExpandable && isExpanded && (
        <div className="flex items-center">
          <div className="w-5" />
          <span className="text-gray-600">{getBracketClose()}{!isLast && <span className="text-gray-500">,</span>}</span>
        </div>
      )}
      
      {isExpandable && !isExpanded && (
        <span className="text-gray-600 ml-5">{getBracketClose()}{!isLast && <span className="text-gray-500">,</span>}</span>
      )}
    </div>
  );
};

export default JsonNode;
