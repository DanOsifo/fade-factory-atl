import { useEffect } from "react";

const BOOKSY_URL =
  "https://booksy.com/en-us/894841_pardon-my-fade_barber-shop_134770_atlanta#ba_s=sr_1";

export default function Book() {
  useEffect(() => {
    window.location.replace(BOOKSY_URL);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="font-bold uppercase tracking-widest text-sm text-gray-500">
        Redirecting to Booksy…
      </p>
    </div>
  );
}
