import { Package, Loader2 } from 'lucide-react';

const SplashScreen = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      
      {/* The glowing, bouncing logo */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
        <div className="p-4 bg-primary rounded-2xl shadow-xl relative z-10 animate-bounce" style={{ animationDuration: '2s' }}>
          <Package className="w-12 h-12 text-primary-foreground" />
        </div>
      </div>
      
      {/* Branding */}
      <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
        Hotel Inventory System
      </h1>
      
      {/* Loading indicator */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Verifying secure session...</span>
      </div>
      
    </div>
  );
};

export default SplashScreen;