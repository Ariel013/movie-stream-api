export function Footer() {
  return (
    <footer className="px-8 py-8 bg-surface-container-low border-t border-outline-variant/10">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-sm font-bold text-on-surface">© 2024 National Healthcare System</p>
          <p className="text-xs text-on-surface-variant font-medium">Unified Blood Management Network Infrastructure</p>
        </div>
        <div className="flex items-center gap-8">
          <a href="#" className="text-xs font-bold text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">Privacy Policy</a>
          <a href="#" className="text-xs font-bold text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">Legal</a>
          <a href="#" className="text-xs font-bold text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">Security</a>
        </div>
      </div>
    </footer>
  );
}
