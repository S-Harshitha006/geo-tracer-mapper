import React from 'react';
import { Activity, Globe } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Globe className="w-8 h-8 text-cyber" />
              <Activity className="w-4 h-4 text-network-active absolute -bottom-1 -right-1 animate-network-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-cyber bg-clip-text text-transparent">
                GeoTracer
              </h1>
              <p className="text-xs text-muted-foreground">Network Route Visualizer</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-xs text-muted-foreground">
              v1.0.0
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;