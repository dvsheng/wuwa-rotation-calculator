import { Link } from '@tanstack/react-router';
import { Calculator } from 'lucide-react';

import { Button } from './ui/button';

export const AppHeader = () => {
  return (
    <header className="bg-card border-border sticky top-0 z-20 flex items-center justify-between border-b p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2">
          <Calculator className="text-primary h-6 w-6" />
        </div>
        <h1 className="from-primary bg-gradient-to-r to-blue-600 bg-clip-text text-xl font-bold text-transparent">
          Wuthering Waves Rotation Builder
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <Calculator size={16} className="mr-2" />
            Calculator
          </Button>
        </Link>
      </div>
    </header>
  );
};
