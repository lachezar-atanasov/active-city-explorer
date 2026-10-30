import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import './index.css';
import App from './App';
import type { Place } from './lib/types';

// The dataset is its own chunk, so the shell paints before it arrives.
import('./data/places.json').then(({ default: dataset }) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App places={dataset.places as unknown as Place[]} />
    </StrictMode>,
  );
});
