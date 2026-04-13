'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';

interface TagData {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function TagPicker({ selected, onChange }: Props) {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch('/api/tags');
        if (res.ok) {
          const data = await res.json();
          setTags(data.tags || []);
        }
      } catch {
        // Silent
      } finally {
        setLoaded(true);
      }
    }
    loadTags();
  }, []);

  function toggle(tagName: string) {
    if (selected.includes(tagName)) {
      onChange(selected.filter((t) => t !== tagName));
    } else {
      onChange([...selected, tagName]);
    }
  }

  if (!loaded) return null;

  if (tags.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <p className="text-sm text-gray-400">No tags yet. Add tags in your <a href="/profile" className="text-blue-600">Profile</a>.</p>
      </div>
    );
  }

  const selectedTags = tags.filter((t) => selected.includes(t.name));

  // Collapsed: show selected tags + expand button
  if (!expanded) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="flex flex-wrap items-center gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: tag.color || '#3B82F6' }}
            >
              {tag.name}
            </span>
          ))}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-600 active:bg-gray-200 min-h-[32px]"
          >
            <Tag size={14} />
            {selectedTags.length === 0 ? 'Add tags' : 'Edit'}
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Expanded: show all tags as toggleable chips
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">Tags</label>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 text-sm text-blue-600 font-medium min-h-[32px]"
        >
          Done
          <ChevronUp size={14} />
        </button>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selected.includes(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.name)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium min-h-[36px] transition-all ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 active:bg-gray-100'
                }`}
                style={isSelected ? { backgroundColor: tag.color || '#3B82F6' } : undefined}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">{selected.length} selected</p>
        )}
      </div>
    </div>
  );
}
