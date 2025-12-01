export function Waveform() {
  return (
    <div className="flex items-center justify-center gap-1.5 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full animate-wave-bar"
          style={{
            animationDelay: `${i * 0.15}s`,
            background: 'linear-gradient(180deg, #F472B6 0%, #A78BFA 100%)', // Pink to purple gradient
          }}
        />
      ))}
    </div>
  );
}
