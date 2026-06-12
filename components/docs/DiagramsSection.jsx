'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card } from '@/components/ui/card';

if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#6366f1',
      primaryTextColor: '#f8fafc',
      primaryBorderColor: '#4f46e5',
      lineColor: '#64748b',
      secondaryColor: '#1a2e4a',
      tertiaryColor: '#0a0e27',
    },
  });
}

export default function DiagramsSection({ diagrams }) {
  const diagramRefs = {
    architecture: useRef(null),
    components: useRef(null),
    dataflow: useRef(null),
  };

  useEffect(() => {
    const renderDiagrams = async () => {
      for (const [key, ref] of Object.entries(diagramRefs)) {
        if (ref.current && diagrams[key]) {
          try {
            const { svg } = await mermaid.render(`mermaid-${key}`, diagrams[key]);
            ref.current.innerHTML = svg;
          } catch (err) {
            ref.current.innerHTML = `<div class="text-red-500">Error rendering diagram: ${err.message}</div>`;
          }
        }
      }
    };
    renderDiagrams();
  }, [diagrams]);

  return (
    <div className="space-y-6">
      {diagrams.architecture && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-bold mb-4">🏗️ Architecture Overview</h3>
          <div ref={diagramRefs.architecture} className="flex justify-center bg-muted/30 p-6 rounded-lg"></div>
        </Card>
      )}
      {diagrams.components && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-bold mb-4">🧩 Component Relationships</h3>
          <div ref={diagramRefs.components} className="flex justify-center bg-muted/30 p-6 rounded-lg"></div>
        </Card>
      )}
      {diagrams.dataflow && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-xl font-bold mb-4">🔄 Data Flow</h3>
          <div ref={diagramRefs.dataflow} className="flex justify-center bg-muted/30 p-6 rounded-lg"></div>
        </Card>
      )}
    </div>
  );
}
