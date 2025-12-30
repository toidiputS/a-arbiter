import React from "react";
import { ArbiterLogo } from "./ArbiterLogo";

export const LogoDemo: React.FC = () => {
  return (
    <div className="p-8 bg-void min-h-screen">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">
        Arbiter Logo Demo
      </h1>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Basic Usage */}
        <div className="glass-panel p-6">
          <h2 className="text-xl text-cyber mb-4">Basic Logo Usage</h2>
          <div className="flex gap-8 items-center">
            <ArbiterLogo size="small" />
            <ArbiterLogo size="medium" />
            <ArbiterLogo size="large" />
          </div>
        </div>

        {/* Animation Examples */}
        <div className="glass-panel p-6">
          <h2 className="text-xl text-cyber mb-4">Animation Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <h3 className="text-white mb-2">Static Logo</h3>
              <ArbiterLogo animated={false} showGlow={false} />
            </div>
            <div className="text-center">
              <h3 className="text-white mb-2">Glow Only</h3>
              <ArbiterLogo animated={false} showGlow={true} />
            </div>
            <div className="text-center">
              <h3 className="text-white mb-2">Float Only</h3>
              <ArbiterLogo animated={true} showGlow={false} />
            </div>
            <div className="text-center">
              <h3 className="text-white mb-2">Full Animation</h3>
              <ArbiterLogo animated={true} showGlow={true} />
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="glass-panel p-6">
          <h2 className="text-xl text-cyber mb-4">How to Use</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-white font-bold mb-2">
                1. Import the component:
              </h3>
              <code className="text-cyber bg-black/50 p-2 block">
                import {"{"} ArbiterLogo {"}"} from './components/ArbiterLogo';
              </code>
            </div>

            <div>
              <h3 className="text-white font-bold mb-2">2. Use in your JSX:</h3>
              <code className="text-cyber bg-black/50 p-2 block">
                {"<"}ArbiterLogo size="medium" animated={true} showGlow={true}{" "}
                {"/>"}
              </code>
            </div>

            <div>
              <h3 className="text-white font-bold mb-2">3. Props available:</h3>
              <ul className="text-white/80 list-disc list-inside space-y-1">
                <li>
                  <code>size</code>: 'small' | 'medium' | 'large'
                </li>
                <li>
                  <code>animated</code>: boolean (enables floating animation)
                </li>
                <li>
                  <code>showGlow</code>: boolean (enables glow effect)
                </li>
                <li>
                  <code>className</code>: string (additional CSS classes)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoDemo;
