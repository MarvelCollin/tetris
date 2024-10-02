import React, { useState } from 'react';

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
}

const Checklist: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [inputValue, setInputValue] = useState<string>('');

  const handleAddItem = () => {
    if (inputValue.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now(),
        text: inputValue,
        completed: false,
      };
      setItems((prevItems) => [...prevItems, newItem]);
      setInputValue('');
    }
  };

  const handleToggleComplete = (id: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Checklist App</h2>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Add a new item"
      />
      <button onClick={handleAddItem}>Add</button>
      <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{
              textDecoration: item.completed ? 'line-through' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <span
              onClick={() => handleToggleComplete(item.id)}
              style={{
                cursor: 'pointer',
                flexGrow: 1,
                textAlign: 'left',
              }}
            >
              {item.text}
            </span>
            <button onClick={() => handleRemoveItem(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Checklist;
