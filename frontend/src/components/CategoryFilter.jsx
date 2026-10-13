import React from 'react';
import { 
  Laptop, FileText, Shirt, Glasses, Key, 
  ShoppingBag, HelpCircle, Layers 
} from 'lucide-react';

const CATEGORY_ICONS = {
  All: Layers,
  Electronics: Laptop,
  Documents: FileText,
  Clothing: Shirt,
  Accessories: Glasses,
  Keys: Key,
  Bags: ShoppingBag,
  Other: HelpCircle,
};

export const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  const allCategories = ['All', ...(categories || [])];

  return (
    <div style={{
      display: 'flex',
      gap: '0.65rem',
      overflowX: 'auto',
      paddingBottom: '0.5rem',
      scrollbarWidth: 'none',
    }}>
      {allCategories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat] || HelpCircle;
        const isSelected = (selectedCategory === '' && cat === 'All') || selectedCategory === cat;

        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat === 'All' ? '' : cat)}
            className={`chip ${isSelected ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Icon size={16} />
            <span>{cat}</span>
          </button>
        );
      })}
    </div>
  );
};
