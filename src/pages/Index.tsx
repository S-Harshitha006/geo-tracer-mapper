import React from 'react';
import Header from '@/components/Header';
import NetworkMap from '@/components/NetworkMap';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-20 h-screen">
        <NetworkMap />
      </main>
    </div>
  );
};

export default Index;
