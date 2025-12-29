import React, { useState, useRef, useEffect } from 'react';
import { Shield, Gavel, Microscope, Upload, FileText, AlertTriangle, Terminal, ChevronRight, Activity, Lock, Cpu, Wifi, Check, Copy, ClipboardCopy, Flame } from 'lucide-react';
import { executeArbiterProtocol } from './services/geminiService';
import { AppStatus } from './types';
import { ReflectiveButton } from './components/ReflectiveButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Custom Renderer for Code Blocks to include Copy Functionality
const CodeBlockRenderer = ({ children, className, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const content = String(children).replace(/\n$/, '');
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!className && !String(children).includes('\n')) {
      return <code className={className} {...props}>{children}</code>;
  }

  return (
    <div className="relative group my-4">
      <div className="absolute top-0 right-0 z-10 p-2">
          <button 
              onClick={handleCopy}
              className="flex items-center gap-2 bg-black/90 border border-cyber/30 hover:border-cyber text-cyber px-2 py-1 text-[10px] uppercase tracking-widest transition-all"
          >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'PAYLOAD SECURED' : 'COPY PAYLOAD'}
          </button>
      </div>
      <div className="absolute top-0 left-0 z-10 px-3 py-1 bg-cyber/10 border-b border-r border-cyber/30 text-[10px] text-cyber font-bold tracking-widest uppercase">
          INDUSTRIAL DELIVERABLE
      </div>
      <pre className={className} style={{paddingTop: '2.5rem'}}>
        <code {...props} className="block p-4">{children}</code>
      </pre>
    </div>
  );
};

// Custom Renderer for Table Cells to Handle Alert Logic
const TableCellRenderer = ({ children, ...props }: any) => {
  const content = String(children);
  // Logic to detect risky scores
  const isCritical = 
      content.includes('0%') || 
      content.includes('CRITICAL') || 
      content.includes('HIGH EXPOSURE') ||
      content.includes('FAIL');

  const className = isCritical 
      ? "text-alert font-bold shadow-[inset_0_0_15px_rgba(255,0,0,0.1)] animate-pulse" 
      : "";

  return <td className={className} {...props}>{children}</td>;
};

// Component to render individual sections with their own Copy button
const ModuleCard: React.FC<{ content: string }> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySection = () => {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
      <div className="relative mb-8 p-4 border-l border-cyber/20 bg-cyber/5 hover:bg-cyber/10 transition-colors group">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                  onClick={handleCopySection}
                  className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-cyber/60 hover:text-cyber"
              >
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  {copied ? 'COPIED' : 'COPY SECTION'}
              </button>
          </div>
          <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                  code: CodeBlockRenderer,
                  td: TableCellRenderer
              }}
          >
              {content}
          </ReactMarkdown>
      </div>
  );
};

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [history, setHistory] = useState('');
  const [contractText, setContractText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [auditComplete, setAuditComplete] = useState(false);
  const [severity, setSeverity] = useState<'STANDARD' | 'HOSTILE'>('STANDARD');
  const [isDragging, setIsDragging] = useState(false);
  
  // Ref for auto-scrolling terminal
  const terminalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, status]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setInputMode('upload');
    
    // Simple text extraction for demo purposes. 
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContractText(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (inputMode !== 'upload') setInputMode('upload');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Check if moving to a child element
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      setInputMode('upload');
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContractText(text);
      };
      reader.readAsText(file);
    }
  };

  const executeProtocol = async () => {
    if (!contractText && !history) {
        alert("INPUT NODES EMPTY. PROTOCOL ABORTED.");
        return;
    }

    setStatus(AppStatus.SCANNING);
    setAuditComplete(false);
    
    // Reset severity to standard while scanning
    setSeverity('STANDARD');
    
    setTimeout(async () => {
        setStatus(AppStatus.ANALYZING);
        try {
            const rawResult = await executeArbiterProtocol(history, contractText);
            
            // Auto-Severity Parser
            let finalResult = rawResult;
            let detectedSeverity: 'STANDARD' | 'HOSTILE' = 'STANDARD';

            if (rawResult.includes('<<MODE:HOSTILE>>')) {
                detectedSeverity = 'HOSTILE';
                finalResult = rawResult.replace('<<MODE:HOSTILE>>', '').trim();
            } else if (rawResult.includes('<<MODE:STANDARD>>')) {
                detectedSeverity = 'STANDARD';
                finalResult = rawResult.replace('<<MODE:STANDARD>>', '').trim();
            }

            setSeverity(detectedSeverity);
            setOutput(finalResult);
            setStatus(AppStatus.COMPLETE);
            setAuditComplete(true);
        } catch (error) {
            setOutput("> CRITICAL SYSTEM ERROR: ORACLE UNREACHABLE.");
            setStatus(AppStatus.ERROR);
        }
    }, 2500);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(output);
    alert("FULL DOSSIER COPIED TO CLIPBOARD");
  };

  const isProcessing = status === AppStatus.SCANNING || status === AppStatus.ANALYZING;

  // Parsing Logic to Split Output into Sections based on '## ' headers
  const renderOutputModules = (fullText: string) => {
    if (!fullText.includes('##')) {
        return <ModuleCard content={fullText} />;
    }

    // Split by '## '
    const parts = fullText.split(/(?=## )/g);

    return parts.map((part, index) => (
        <ModuleCard key={index} content={part} />
    ));
  };

  return (
    <div className="min-h-screen bg-void text-cyber selection:bg-cyber selection:text-black flex flex-col items-center justify-center p-4 md:p-8 relative">
      
      {/* VIGNETTE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>

      <div className="w-full max-w-6xl relative z-10 flex flex-col gap-6">
        
        {/* TOP BAR / STATUS METRICS */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center border-b border-cyber/20 pb-4 gap-4">
            <div className="flex items-center gap-4">
                <Shield className={`w-10 h-10 drop-shadow-[0_0_10px_rgba(50,205,50,0.5)] transition-colors duration-1000 ${severity === 'HOSTILE' ? 'text-alert drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 'text-cyber'}`} />
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white">
                        ARBITER <span className={`text-sm tracking-widest font-normal opacity-70 align-top ml-1 transition-colors duration-1000 ${severity === 'HOSTILE' ? 'text-alert' : 'text-cyber'}`}>CONTRACTS</span>
                    </h1>
                    <div className={`flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase transition-colors duration-1000 ${severity === 'HOSTILE' ? 'text-alert/60' : 'text-cyber/60'}`}>
                        <span className={`w-1 h-1 rounded-full ${auditComplete ? 'animate-none' : 'animate-pulse'} ${severity === 'HOSTILE' ? 'bg-alert' : 'bg-cyber'}`}></span>
                        Sovereign Tech Link
                    </div>
                </div>
            </div>

            {/* System Metrics HUD */}
            <div className={`flex items-center gap-6 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-colors duration-1000 ${severity === 'HOSTILE' ? 'text-alert/40' : 'text-cyber/40'}`}>
                <div className="flex items-center gap-2">
                    <Wifi size={12} />
                    <span>Lat: 12ms</span>
                </div>
                <div className="flex items-center gap-2 hidden md:flex">
                    <Cpu size={12} />
                    <span>Core: Active</span>
                </div>
                <div className={`flex items-center gap-2 transition-all duration-1000 ${status === AppStatus.ERROR ? 'text-alert animate-pulse' : (status === AppStatus.COMPLETE ? (severity === 'HOSTILE' ? 'text-alert animate-pulse' : 'text-cyber animate-pulse') : '')}`}>
                    <Lock size={12} />
                    <span>ENC: 256-BIT</span>
                </div>
                <div className={`border px-2 py-1 transition-all duration-1000 ${status === AppStatus.ERROR ? 'bg-alert text-black border-alert font-bold animate-pulse' : (status === AppStatus.COMPLETE ? (severity === 'HOSTILE' ? 'bg-alert text-black border-alert font-bold animate-pulse' : 'bg-cyber text-black border-cyber font-bold animate-pulse') : (severity === 'HOSTILE' ? 'bg-alert/5 text-alert border-alert/30' : 'bg-cyber/5 text-cyber border-cyber/30'))}`}>
                    {status === AppStatus.ERROR ? 'SYS.FAILURE' : (status === AppStatus.COMPLETE ? (severity === 'HOSTILE' ? 'THREAT DETECTED' : 'PROTOCOL SEALED') : 'SYS.READY')}
                </div>
            </div>
        </div>

        {/* MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            
            {/* LEFT: COMMAND & CONTROL */}
            <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Mission Directive */}
                <div className={`border-l-2 pl-4 py-1 transition-colors duration-1000 ${severity === 'HOSTILE' ? 'border-alert/50' : 'border-cyber/50'}`}>
                    <p className="text-white/60 text-xs tracking-widest uppercase mb-1">Operational Mandate</p>
                    <p className="text-white font-light text-sm leading-relaxed">
                        Shreds legal ambiguity to secure maximum leverage and IP protection.
                    </p>
                </div>

                {/* Input A: History */}
                <div className={`glass-panel p-1 group transition-all duration-500 ${severity === 'HOSTILE' ? 'border-alert/30' : ''}`}>
                    <div className="relative p-5 bg-black/40 h-full">
                        {/* Corner Accents - Color Shift */}
                        <div className={`tech-corner tl ${severity === 'HOSTILE' ? '!border-alert' : ''}`}></div>
                        <div className={`tech-corner tr ${severity === 'HOSTILE' ? '!border-alert' : ''}`}></div>
                        <div className={`tech-corner bl ${severity === 'HOSTILE' ? '!border-alert' : ''}`}></div>
                        <div className={`tech-corner br ${severity === 'HOSTILE' ? '!border-alert' : ''}`}></div>

                        <label className={`flex items-center gap-2 text-[10px] font-bold tracking-widest mb-3 uppercase ${severity === 'HOSTILE' ? 'text-alert' : 'text-cyber/80'}`}>
                            <Microscope size={12} /> 
                            Target Profile // History
                        </label>
                        <textarea 
                            className={`tech-input w-full h-32 p-3 text-sm resize-none ${severity === 'HOSTILE' ? 'focus:border-alert focus:shadow-[inset_0_0_15px_rgba(255,0,0,0.05)]' : ''}`}
                            placeholder="INPUT COUNTER-PARTY REPUTATION DATA..."
                            value={history}
                            onChange={(e) => setHistory(e.target.value)}
                            disabled={isProcessing}
                        />
                    </div>
                </div>

                {/* Input B: Contract with Toggle */}
                <div 
                    className={`glass-panel p-1 group transition-colors duration-300 ${fileName && inputMode === 'upload' ? 'border-cyber/50' : ''} ${severity === 'HOSTILE' ? 'border-alert/30' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="relative p-5 bg-black/40 h-full flex flex-col">
                        <div className={`tech-corner tl ${severity === 'HOSTILE' ? '!border-alert' : ''}`}></div>
                        <div className={`tech-corner tr ${severity === 'HOSTILE' ? '!border-alert' : ''}`}></div>
                        <div className={`tech-corner bl ${severity === 'HOSTILE' ? '!border-alert' : ''}`}></div>
                        <div className={`tech-corner br ${severity === 'HOSTILE' ? '!border-alert' : ''}`}></div>

                        {/* Header with Toggle */}
                        <div className="flex justify-between items-center mb-3">
                            <label className={`flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase ${severity === 'HOSTILE' ? 'text-alert' : 'text-cyber/80'}`}>
                                <Gavel size={12} /> 
                                Payload // Contract
                            </label>
                            
                            {/* Mode Toggle */}
                            <div className="flex gap-3 text-[9px] font-bold tracking-[0.2em]">
                                <button 
                                    onClick={() => setInputMode('upload')}
                                    className={`uppercase transition-all duration-300 ${inputMode === 'upload' ? (severity === 'HOSTILE' ? 'text-alert border-b border-alert' : 'text-cyber border-b border-cyber') : 'text-white/20 hover:text-white'}`}
                                >
                                    Upload
                                </button>
                                <button 
                                    onClick={() => setInputMode('text')}
                                    className={`uppercase transition-all duration-300 ${inputMode === 'text' ? (severity === 'HOSTILE' ? 'text-alert border-b border-alert' : 'text-cyber border-b border-cyber') : 'text-white/20 hover:text-white'}`}
                                >
                                    Paste
                                </button>
                            </div>
                        </div>
                        
                        {inputMode === 'upload' ? (
                            <>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    onChange={handleFileUpload}
                                    accept=".txt,.md,.pdf,.doc,.docx" 
                                />

                                <div 
                                    className={`flex flex-col items-center justify-center h-32 cursor-pointer border border-dashed transition-all duration-300 
                                    ${fileName ? 'bg-cyber/5' : ''} 
                                    ${
                                        isDragging 
                                        ? (severity === 'HOSTILE' ? 'border-alert bg-alert/10 shadow-[0_0_20px_rgba(255,0,0,0.3)] scale-[1.02]' : 'border-cyber bg-cyber/10 shadow-[0_0_20px_rgba(50,205,50,0.3)] scale-[1.02]')
                                        : (severity === 'HOSTILE' ? 'border-alert/20 hover:border-alert hover:bg-alert/5' : 'border-cyber/20 hover:border-cyber hover:bg-cyber/5')
                                    }`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {fileName ? (
                                        <div className="text-center">
                                            <FileText className={`w-8 h-8 mb-2 mx-auto ${severity === 'HOSTILE' ? 'text-alert' : 'text-cyber'}`} />
                                            <span className="text-white text-xs font-mono">{fileName}</span>
                                            <span className={`block text-[10px] mt-1 tracking-widest ${severity === 'HOSTILE' ? 'text-alert/60' : 'text-cyber/60'}`}>UPLOAD COMPLETE</span>
                                        </div>
                                    ) : (
                                        <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
                                            <Upload className={`w-8 h-8 mb-2 mx-auto ${severity === 'HOSTILE' ? 'text-alert' : 'text-cyber'}`} />
                                            <span className="text-[10px] uppercase tracking-widest">Drop File or Click</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <textarea 
                                className={`tech-input w-full h-32 p-3 text-sm resize-none font-mono focus:bg-black/80 ${severity === 'HOSTILE' ? 'focus:border-alert' : ''}`}
                                placeholder="PASTE RAW CONTRACT TEXT HERE..."
                                value={contractText}
                                onChange={(e) => {
                                    setContractText(e.target.value);
                                    if (fileName) setFileName(null);
                                }}
                                disabled={isProcessing}
                            />
                        )}
                    </div>
                </div>

                {/* Execution Button */}
                <div className="pt-2">
                    <ReflectiveButton 
                        variant="primary"
                        onClick={executeProtocol}
                        isLoading={isProcessing}
                        className={`w-full shadow-neon ${severity === 'HOSTILE' ? '!border-alert !text-alert hover:!bg-alert hover:!text-black shadow-[0_0_20px_rgba(255,0,0,0.2)]' : ''}`}
                    >
                        <span className="flex items-center gap-3">
                            {isProcessing ? 'SCANNING' : (severity === 'HOSTILE' ? 'EXECUTE HOSTILE AUDIT' : 'EXECUTE SURGICAL AUDIT')} <ChevronRight size={14} />
                        </span>
                    </ReflectiveButton>
                    
                    {status === AppStatus.ERROR && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-alert text-[10px] font-bold tracking-widest animate-pulse">
                            <AlertTriangle size={12} />
                            PROTOCOL FAILURE: LINK SEVERED
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: THE NEXUS / TERMINAL */}
            <div className="lg:col-span-7 flex flex-col h-[600px] lg:h-auto">
                 <div className={`flex-grow glass-panel border relative flex flex-col overflow-hidden shadow-panel ${severity === 'HOSTILE' ? 'border-alert/20' : 'border-cyber/20'}`}>
                    
                    {/* Monitor Header */}
                    <div className={`bg-black/80 p-3 flex justify-between items-center border-b ${severity === 'HOSTILE' ? 'border-alert/20' : 'border-cyber/20'}`}>
                        <div className="flex gap-1.5 opacity-50">
                            <div className={`w-2 h-2 rounded-full ${severity === 'HOSTILE' ? 'bg-alert' : 'bg-cyber'}`}></div>
                            <div className={`w-2 h-2 rounded-full ${severity === 'HOSTILE' ? 'bg-alert/50' : 'bg-cyber/50'}`}></div>
                            <div className={`w-2 h-2 rounded-full ${severity === 'HOSTILE' ? 'bg-alert/20' : 'bg-cyber/20'}`}></div>
                        </div>
                        <div className="flex items-center gap-4">
                             {auditComplete && (
                                <button 
                                    onClick={handleCopyAll}
                                    className={`flex items-center gap-2 hover:text-white transition-colors text-[10px] uppercase tracking-widest mr-4 ${severity === 'HOSTILE' ? 'text-alert' : 'text-cyber'}`}
                                >
                                    <ClipboardCopy size={12} />
                                    COPY FULL DOSSIER
                                </button>
                             )}
                             <span className={`text-[10px] tracking-[0.2em] ${severity === 'HOSTILE' ? 'text-alert/40' : 'text-cyber/40'}`}>MEM: 64TB</span>
                             <span className={`text-[10px] font-bold tracking-widest ${severity === 'HOSTILE' ? 'text-alert/70' : 'text-cyber/70'}`}>NEXUS TERMINAL v9.2</span>
                        </div>
                    </div>

                    {/* Terminal Content Area */}
                    <div ref={terminalRef} className="flex-grow p-6 overflow-y-auto font-mono text-sm relative bg-black/40 scrollbar-custom">
                        
                        {status === AppStatus.IDLE && (
                            <div className={`h-full flex flex-col items-center justify-center ${severity === 'HOSTILE' ? 'text-alert/20' : 'text-cyber/20'}`}>
                                <Terminal size={64} className="mb-6 opacity-30 animate-pulse" />
                                <p className="text-center tracking-[0.3em] uppercase text-xs">Awaiting Neural Input</p>
                            </div>
                        )}

                        {status === AppStatus.SCANNING && (
                             <div className="space-y-4 max-w-md mx-auto mt-20">
                                <div className={`flex justify-between text-xs tracking-widest mb-1 ${severity === 'HOSTILE' ? 'text-alert/60' : 'text-cyber/60'}`}>
                                    <span>SCANNING</span>
                                    <span>34%</span>
                                </div>
                                <div className={`w-full h-1 ${severity === 'HOSTILE' ? 'bg-alert/10' : 'bg-cyber/10'}`}>
                                    <div className={`h-full animate-[width_2s_ease-in-out_infinite] w-1/3 ${severity === 'HOSTILE' ? 'bg-alert' : 'bg-cyber'}`}></div>
                                </div>
                                <div className={`font-mono text-[10px] space-y-1 mt-4 ${severity === 'HOSTILE' ? 'text-alert/40' : 'text-cyber/40'}`}>
                                    <p>> ACCESSING SECURE LEDGER...</p>
                                    <p>> PARSING LEGAL VECTORS...</p>
                                    <p>> ENCRYPTING OUTPUT STREAM...</p>
                                </div>
                             </div>
                        )}

                        {status === AppStatus.ANALYZING && (
                             <div className="space-y-3">
                                <p className={`text-xs tracking-widest border-b pb-2 mb-4 ${severity === 'HOSTILE' ? 'text-alert border-alert/20' : 'text-cyber border-cyber/20'}`}>GENESIS PROTOCOL: ENGAGED</p>
                                <p className="text-white/80">{"> TARGET IDENTIFIED."}</p>
                                <p className="text-white/80">{"> COMPILING LEVERAGE POINTS..."}</p>
                                <p className="text-alert animate-pulse mt-4">{"> 3 CRITICAL VULNERABILITIES DETECTED."}</p>
                                <p className={`mt-2 text-xs ${severity === 'HOSTILE' ? 'text-alert/60' : 'text-cyber/60'}`}>Architecting Solution...</p>
                             </div>
                        )}

                        {status === AppStatus.COMPLETE && output && (
                             <div className="markdown-content">
                                {renderOutputModules(output)}
                             </div>
                        )}
                    </div>
                    
                    {/* Screen Effects */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20 opacity-20"></div>
                 </div>
            </div>

        </div>

        {/* FOOTER */}
        <footer className="mt-4 border-t border-cyber/10 pt-4 flex justify-between items-center text-[10px] text-cyber/30 uppercase tracking-widest">
            <div>Arbiter™ // Industrial Legal Architect</div>
            <div className="flex gap-4">
                <span>SECURE</span>
                <span>ENCRYPTED</span>
                <span>SOVEREIGN</span>
            </div>
        </footer>

      </div>
    </div>
  );
};

export default App;
