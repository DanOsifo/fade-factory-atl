import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const BARBER_BOOKSY: Record<string, string> = {
  akeem: "https://booksy.com/en-us/894841_pardon-my-fade_barber-shop_134770_atlanta#ba_s=sr_1",
  jeff:  "https://booksy.com/en-us/813636_jefe-da-barber_barber-shop_134770_atlanta#ba_s=sr_1",
  naz:   "https://booksy.com/en-us/1666983_tonsorial-co_barber-shop_134770_atlanta#ba_s=sr_1",
};
const BOOKSY_DEFAULT = "https://booksy.com/en-us/894841_pardon-my-fade_barber-shop_134770_atlanta#ba_s=sr_1";

type Barber = {
  id: number;
  name: string;
  title: string;
  photoUrl: string | null | undefined;
  accentColor: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  barbers: Barber[] | undefined;
};

/** Returns true if a hex color is light enough to need dark text. */
function isLightColor(hex: string): boolean {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  // Perceived luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

export default function BarberPickerModal({ isOpen, onClose, barbers }: Props) {
  function handleBarberClick(barberName: string) {
    const url = BARBER_BOOKSY[barberName.toLowerCase()] ?? BOOKSY_DEFAULT;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="barber-picker-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            key="barber-picker-panel"
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button — inside the panel, always reachable on mobile */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
            >
              <X size={18} />
            </button>

            <p className="text-center text-white/50 text-[11px] uppercase tracking-[0.3em] pt-5 pb-4 font-bold">
              Who are you booking with?
            </p>

            {/* Fallback when barber data is unavailable */}
            {(!barbers || barbers.length === 0) && (
              <div className="text-center py-6 flex flex-col items-center gap-5">
                {!barbers && (
                  <p className="text-white/40 text-xs uppercase tracking-widest">Loading…</p>
                )}
                <a
                  href={BOOKSY_DEFAULT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-black font-black uppercase tracking-widest text-sm px-10 py-4 hover:bg-accent-red hover:text-white transition-colors"
                  onClick={onClose}
                >
                  Continue to Booksy
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-4 px-1">
              {(barbers ?? []).map(barber => {
                const lightAccent = isLightColor(barber.accentColor);
                const ctaTextColor = lightAccent ? "#000000" : "#FFFFFF";
                const badgeTextColor = lightAccent ? "#000000" : "#FFFFFF";
                return (
                  <button
                    key={barber.id}
                    onClick={() => handleBarberClick(barber.name)}
                    className="rounded-xl overflow-hidden bg-black flex flex-col group transition-all duration-200 text-left w-full focus:outline-none"
                    style={{
                      border: `2px solid ${barber.accentColor}`,
                      boxShadow: `0 0 16px ${barber.accentColor}33`,
                    }}
                  >
                    {/* Photo */}
                    <div className="relative h-36 overflow-hidden">
                      {barber.photoUrl && (
                        <img
                          src={barber.photoUrl}
                          alt={barber.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <span
                          className="block text-[9px] font-black uppercase tracking-widest px-2 py-1 text-center"
                          style={{ background: barber.accentColor, color: badgeTextColor }}
                        >
                          {barber.title}
                        </span>
                      </div>
                    </div>

                    {/* Name + CTA */}
                    <div className="p-3 flex flex-col flex-1 gap-2">
                      <h3 className="font-display text-2xl uppercase text-white leading-none">
                        {barber.name}
                      </h3>
                      <div
                        className="w-full font-black uppercase tracking-widest text-xs py-2.5 text-center group-hover:brightness-110 transition-all"
                        style={{ background: barber.accentColor, color: ctaTextColor }}
                      >
                        Book with {barber.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
