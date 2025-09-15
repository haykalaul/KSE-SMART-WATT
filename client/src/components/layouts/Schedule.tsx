"use client";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useId, useRef, useState } from "react";
import { JwtPayload, Recommendations } from "@/types/type";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import {
  convertApplianceStringToObject,
  exportToPDF,
  getTariffCost,
  mapStringsToObjects,
} from "@/helper/function";
import { FaRegFilePdf } from "react-icons/fa6";
import { jwtDecode } from "jwt-decode";
import NotPremium from "../templates/NotPremium";
import { getBackendURL, getMode } from "@/lib/readenv";

export default function Schedule() {
  const backendURL =
    getMode() === "production" ? getBackendURL() : "http://localhost:8080";
  const [payload, setPayload] = useState<JwtPayload>({
    email: "",
    username: "",
    premium: false,
  });

  function decodeJwt(token: string): JwtPayload | null {
    try {
      const decoded = jwtDecode(token);
      return decoded as JwtPayload;
    } catch (error) {
      console.error("Invalid JWT token:", error);
      return null;
    }
  }

  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    if (storedToken) {
      const decodedPayload = decodeJwt(storedToken);
      if (decodedPayload) {
        setPayload(decodedPayload);
      }
    }
  }, []);

  const [Golongan, setGolongan] = useState<string>("");
  const golonganListrik = [
    "Subsidi daya 450 VA",
    "Subsidi daya 900 VA",
    "R-1/TR daya 900 VA",
    "R-1/TR daya 1300 VA",
    "R-1/TR daya 2200 VA",
    "R-2/TR daya 3500 VA - 5500 VA",
    "R-3/TR daya 6600 VA ke atas",
    "B-2/TR daya 6600 VA - 200 kVA",
    "B-3/TM daya di atas 200 kVA",
    "I-3/TM daya di atas 200 kVA",
    "I-4/TT daya 30.000 kVA ke atas",
    "P-1/TR daya 6600 VA - 200 kVA",
    "P-2/TM daya di atas 200 kVA",
    "P-3/TR penerangan jalan umum",
    "L/TR",
    "L/TM",
    "L/TT",
  ];

  const [targetCost, setTargetCost] = useState(48048);
  const [recommendations, setRecommendations] = useState<Recommendations>({
    message: "",
    recommendations: [],
  });

  function onClick(adjustment: number) {
    if (targetCost === 48048) setTargetCost(40000 + adjustment);
    else setTargetCost(targetCost + adjustment);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Mencegah reload halaman

    const formData = new FormData(event.currentTarget);
    const electricType = formData.get("ElectricityTier")?.toString();
    const targetCost = parseInt(
      formData.get("targetCost")?.toString() || "0",
      10
    );

    if (!electricType || !targetCost) {
      alert("Please select an electricity tier and set a valid target cost.");
      return;
    }

    // Hitung bulan berikutnya
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const formattedNextMonth = nextMonth.toISOString().split("T")[0];

    const inputs = {
      golongan: electricType,
      maks_biaya: targetCost,
      tanggal: formattedNextMonth,
    };

    try {
      const response = await fetch(
        `${backendURL}/v1/generate-monthly-recommendations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(inputs),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate recommendations.");
      }

      const data = await response.json();
      setRecommendations({
        message: data.data[0],
        recommendations: data.data.slice(1),
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate recommendations.");
    }
  }

  function handleExportPDF() {
    const energyRegex = /Total Energi = ([\d.]+) kWh/; // Regex untuk total energi

    // Pastikan `recommendations.message` adalah string
    if (typeof recommendations.message !== "string") {
      console.error("Invalid recommendations.message format");
      return;
    }

    // Ekstraksi energi dan biaya
    const energyMatch = recommendations.message.match(energyRegex);

    const totalEnergy = energyMatch ? parseFloat(energyMatch[1]) : 0;

    // Parsing total cost dengan benar
    const totalCost = recommendations.message.split("Rp")[1].split(")")[0];

    // Konversi data appliances menjadi objek
    const appliances = recommendations.recommendations.map((recommendation) => {
      return convertApplianceStringToObject(recommendation);
    });

    // Struktur data untuk PDF
    const data = {
      summary: {
        message: recommendations.message.split(" ").slice(0, 3).join(" "), // Ambil 3 kata pertama untuk ringkasan
        total_energy: totalEnergy,
        total_cost: totalCost,
      },
      appliances, // Data appliances hasil konversi
    };

    // Ekspor ke PDF
    exportToPDF(data);
  }

  return payload.premium ? (
    <div className="flex w-full h-full p-4 gap-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gradient-to-br from-lightGray to-teal-300 w-full h-full basis-1/3 rounded-3xl flex flex-col items-center justify-between py-8 px-2"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 text-center">
            Set Your Target Cost
          </h1>
          <p className="text-slate-700 text-center text-sm">
            Define the maximum amount you want to spend on electricity this
            month.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <h1>Electricity Tier</h1>
          <select
            onChange={(e) => {
              setGolongan(e.target.value);
            }}
            id="ElectricityTier"
            name="ElectricityTier"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
            required
          >
            <option value="Select Your Electricity Tier" disabled>
              Select Your Electricity Tier
            </option>
            {golonganListrik.map((golongan) => (
              <option key={golongan} value={golongan}>
                {golongan}
              </option>
            ))}
          </select>
          <p className="text-zinc-800 mt-1 text-xs">
            IDR {getTariffCost(Golongan) > 0 && getTariffCost(Golongan)}/kWh
          </p>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="-mb-2">Set Your Target Cost</h1>
          <div className="px-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onClick(-10000)}
                disabled={targetCost <= 100}
              >
                <Minus />
                <span className="sr-only">Decrease</span>
              </Button>
              <div className="flex-1 text-center">
                <input
                  name="targetCost"
                  type="number"
                  value={targetCost}
                  onChange={(e) => {
                    const newTargetCost = Math.max(
                      100,
                      Math.min(10000000, parseInt(e.target.value) || 0)
                    );
                    setTargetCost(newTargetCost);
                  }}
                  className="w-full text-6xl font-bold tracking-tighter bg-transparent border-none focus:outline-none text-center"
                />
                <div className="text-[0.70rem] uppercase text-muted-foreground -mt-5">
                  IDR/Month
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onClick(10000)}
                disabled={targetCost >= 10000000}
              >
                <Plus />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
          </div>
        </div>
        <Button type="submit" className="px-10 text-teal-400">
          Generate
        </Button>
      </form>
      <div className="bg-gradient-to-br from-lightGray to-teal-300 w-full h-full basis-2/3 rounded-3xl">
        {recommendations.message ? (
          <ResultComponent
            data={recommendations}
            handleExportPDF={handleExportPDF}
          />
        ) : (
          <InitComponent />
        )}
      </div>
    </div>
  ) : (
    <NotPremium />
  );
}

function ResultComponent(props: {
  data: Recommendations;
  handleExportPDF: () => void;
}) {
  const cards = mapStringsToObjects(props.data.recommendations);
  const [active, setActive] = useState<(typeof cards)[number] | boolean | null>(
    null
  );
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <div className="h-full w-full py-6">
      <div className="flex items-center justify-center gap-4 mb-3 relative">
        <h1 className="text-2xl font-bold text-center">
          Your Appliance Schedule Summary
        </h1>
        <button
          onClick={props.handleExportPDF}
          type="button"
          className="py-1 px-2.5 text-red-500 rounded-lg border-red-500 hover:text-black duration-500 flex items-center gap-1 absolute right-2"
        >
          Download
          <FaRegFilePdf />
        </button>
      </div>

      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 h-full w-full z-40"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0  grid place-items-center z-50 ">
            <motion.button
              key={`button-${active.name}-${id}`}
              layout
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.05,
                },
              }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.name}-${id}`}
              ref={ref}
              className="relative w-full max-w-[500px] border-4 border-teal-600 h-[38rem] flex flex-col  bg-gradient-to-br from-lightGray via-teal-200 to-tealBright sm:rounded-3xl"
            >
              <motion.div layoutId={`image-${active.name}-${id}`}>
                <img
                  width={200}
                  height={200}
                  src={`/appliance/${active.type}.png`}
                  alt={active.name || ""}
                  className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-contain object-top"
                />
              </motion.div>

              <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                  <motion.h3
                    layoutId={`name-${active.name}-${id}`}
                    className="font-bold text-neutral-700 dark:text-neutral-200"
                  >
                    {active.name}
                  </motion.h3>
                  <motion.p
                    className={`py-1 px-3 rounded-full text-black uppercase font-bold text-xs ${
                      active.priority ? "bg-green-500" : "bg-yellow-300"
                    }`}
                  >
                    {active.priority ? "High Priority" : "Low Priority"}
                  </motion.p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col items-center">
                    <h1 className="text-sm font-light text-center">
                      Total Energy (kWh) in this month
                    </h1>
                    <h2 className="font-bold text-lg -mt-1">
                      {active.monthlyUse} kWh
                    </h2>
                  </div>
                  <div className="flex flex-col items-center">
                    <h1 className="text-sm font-light text-center">
                      Total Cost (IDR) in this month
                    </h1>
                    <h2 className="font-bold text-lg -mt-1">
                      {active.cost} IDR
                    </h2>
                  </div>
                </div>
                <div className="mt-4 px-4">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-black py-2 text-black text-xs md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-start overflow-auto dark:text-neutral-400 [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
                  >
                    <h1 className="font-bold text-lg">Recommended Schedule</h1>
                    <ul className="gap-2 justify-between">
                      {active.schedule[0].split(" ").map((time, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gradient-to-r from-teal-500 to-tealBright rounded-full" />
                          <p className="text-sm">{time}</p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                  <motion.button
                    onClick={() => setActive(null)}
                    layoutId={`button-${active.name}-${id}`}
                    className="px-5 py-2 text-sm rounded-full font-bold bg-gradient-to-r from-teal-200 to-lightGray text-tealBright absolute bottom-4 right-4"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul className="max-w-3xl mx-auto w-full gap-4 overflow-scroll h-[90%]">
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card.name}-${id}`}
            key={`card-${card.name}-${id}`}
            onClick={() => setActive(card)}
            className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
          >
            <div className="flex gap-4 flex-col md:flex-row ">
              <motion.div layoutId={`image-${card.name}-${id}`}>
                <img
                  width={100}
                  height={100}
                  src={`/appliance/${card.type}.png`}
                  alt={card.name || ""}
                  className="h-40 w-40 md:h-14 md:w-14 rounded-lg object-cover object-top"
                />
              </motion.div>
              <div className="">
                <motion.h3
                  layoutId={`name-${card.name}-${id}`}
                  className="font-medium text-neutral-800 dark:text-neutral-200 text-center md:text-left"
                >
                  {card.name}
                </motion.h3>
                <motion.p
                  className={`py-1 px-3 rounded-full text-black uppercase font-bold text-xs w-fit ${
                    card.priority ? "bg-green-500" : "bg-yellow-300"
                  }`}
                >
                  {card.priority ? "High Priority" : "Low Priority"}
                </motion.p>
              </div>
            </div>
            <motion.button
              layoutId={`button-${card.name}-${id}`}
              className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-gradient-to-r hover:from-teal-200 hover:to-tealBright hover:text-white text-black mt-4 md:mt-0"
            >
              {card.ctaText}
            </motion.button>
          </motion.div>
        ))}
      </ul>
    </div>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

function InitComponent() {
  return (
    <div className="h-full w-full flex flex-col justify-between p-10 items-center">
      <h1 className="text-3xl font-bold">Let’s Set Your Energy Target!</h1>
      <img className="h-64 my-4" src="/characters/4.png" alt="" />
      <p className="text-center text-zinc-800">
        Start by setting your electricity tier and target cost on the left.{" "}
      </p>
    </div>
  );
}
