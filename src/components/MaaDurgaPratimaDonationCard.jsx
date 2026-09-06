import { Sparkles } from "lucide-react";
import { useDonationFlow } from "../context/DonationFlowContext";

const MaaDurgaPratimaDonationCard = () => {
  const { openMaaDurgaPratimaDonation } = useDonationFlow();

  return (
    <section className="py-8" aria-labelledby="maa-durga-pratima-heading">
      <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-red-700 via-red-600 to-amber-500 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              Special Contribution
            </div>
            <h2
              id="maa-durga-pratima-heading"
              className="text-2xl font-bold sm:text-3xl"
            >
              Maa Durga Pratima
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-50 sm:text-base">
              Make a dedicated contribution towards Maa Durga Pratima. The
              minimum contribution is ₹2,500 per person.
            </p>
          </div>
          <button
            type="button"
            onClick={openMaaDurgaPratimaDonation}
            className="w-full shrink-0 rounded-full bg-white px-6 py-3 font-semibold text-red-700 shadow-md transition hover:bg-amber-50 md:w-auto"
          >
            Donate for Maa Durga Pratima
          </button>
        </div>
      </div>
    </section>
  );
};

export default MaaDurgaPratimaDonationCard;
