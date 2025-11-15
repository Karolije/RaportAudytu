import React from 'react';
import { categories } from '../data/questions';

type TabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveTab(cat)}
          style={{
            padding: '8px 14px',
            borderRadius: 6,
            border: activeTab === cat ? '2px solid #1976d2' : '1px solid #ccc',
            backgroundColor: activeTab === cat ? '#e3f2fd' : 'white',
            cursor: 'pointer',
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};
