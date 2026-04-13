'use client';

import { useState, useEffect } from 'react';

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function TagPicker({ selected, onChange }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch('/api/tags');
        if (res.ok) {
          const data = await res.json();
          setTags(data.tags || []);
        }
      } catch {
        // Silent fail
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

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selected.includes(tag.name);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.name)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium min-h-[36px] transition-colors border-2 ${
                isSelected
                  ? 'text-white border-transparent'
                  : 'bg-white border-gray-200 text-gray-600 active:bg-gray-100'
              }`}
              style={isSelected ? { backgroundColor: tag.color || '#3B82F6', borderColor: tag.color || '#3B82F6' } : undefined}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
