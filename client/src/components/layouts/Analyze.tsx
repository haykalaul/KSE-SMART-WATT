"use client";
import { cn } from "@/lib/utils";
import { Appliance, JwtPayload, ResponseType } from "@/types/type";
import { useEffect, useId, useRef, useState } from "react";
import useSWR from "swr";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { IoIosWarning } from "react-icons/io";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import { FcElectroDevices } from "react-icons/fc";
import { jwtDecode } from "jwt-decode";
import NotPremium from "../templates/NotPremium";
import { getBackendURL, getMode } from "@/lib/readenv";

export default function Analyze() {
  const backendURL =
    getMode() === "production" ? getBackendURL() : "http://localhost:8080";
  // Get JWT payload from cookie
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

  // GET request to fetch appliance data 🐳
  const [appliance, setAppliance] = useState<Appliance[]>([]);
  const applianceFetcher = (url: string, init: RequestInit | undefined) =>
    fetch(url, init).then((res) => res.json());
  const { data } = useSWR(`${backendURL}/v1/appliance`, (url) =>
    applianceFetcher(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
  );

  useEffect(() => {
    if (data?.status) {
      setAppliance(data.data);
      const initialUsage = data.data.map((app: Appliance) => ({
        name: app.name,
        target: app.daily_use_target,
      }));
      setTargetUsage(initialUsage);
    }
  }, [data]);
  // GET request to fetch appliance data 🐳

  // Fetch daily target history from Redis 🐳
  const [historicalTarget, setHistoricalTarget] = useState<
    { name: string; target: number }[]
  >([]);
  useEffect(() => {
    const fetchHistoricalTarget = async () => {
      const response = await fetch(`${backendURL}/v1/get-daily-target`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: payload.email }),
      });

      const res = await response.json();
      if (res.status) {
        setHistoricalTarget(res.data);
      } else {
        console.error("Failed to fetch historical data:", res);
      }
    };

    fetchHistoricalTarget();
  }, [payload.email]);
  // Fetch daily target history from Redis 🐳

  // Set target usage from historical data 🐳
  const [targetUsage, setTargetUsage] = useState<
    { name: string; target: number }[]
  >([]);
  // Fungsi untuk mengubah target usage berdasarkan appliance name
  function updateTargetUsage(name: string, adjustment: number) {
    setTargetUsage((prev) =>
      prev.map((item) =>
        item.name === name
          ? { ...item, target: Math.max(0, item.target + adjustment) } // Minimal 0
          : item
      )
    );
  }

  // Function to update daily target
  const [success, setSuccess] = useState<boolean>(false);
  async function setDailyTarget() {
    const response = await fetch(`${backendURL}/v1/set-daily-target`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: targetUsage, email: payload.email }),
    });

    const res = await response.json();
    if (res.status) {
      console.log(res);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } else {
      console.error(res);
    }
  }

  const [recommendation, setRecommendation] = useState<ResponseType | null>();
  // Fungsi untuk generate recommendation🐳
  async function generateRecommendation() {
    const response = await fetch(
      `${backendURL}/v1/generate-daily-recommendations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ golongan: "R-1/TR daya 1300 VA" }),
      }
    );

    const res = await response.json();
    if (res.status) {
      setRecommendation(res.data);
    } else {
      console.error(res);
    }
  }
  // Fungsi untuk generate recommendation🐳

  // Set target usage from historical data 🐳
  useEffect(() => {
    if (historicalTarget && historicalTarget.length > 0) {
      setTargetUsage(historicalTarget);
    }
  }, [historicalTarget]);
  // Set target usage from historical data 🐳

  return payload.premium ? (
    recommendation ? (
      <AnalyzeResult data={recommendation} />
    ) : (
      <div className="relative z-10">
        <h1 className="text-sm font-bold font-poppins z-50 sticky left-1/2 -translate-x-1/2 top-2 shadow-medium shadow-lightGray ml-4 mb-3 text-black bg-gradient-to-br from-lightGray via-lightGray to-teal-300 py-2 px-5 rounded-xl w-fit">
          Device Limit Management
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-4 max-w-7xl mx-auto">
          {appliance.map((app, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col lg:border-r pt-10 relative group/feature"
              )}
            >
              <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
                <img
                  className="h-12 w-12 object-contain"
                  src={`/appliance/${app.type}.png`}
                  alt=""
                />
              </div>
              <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div className="flex w-full flex-col">
                  <div className="flex flex-col">
                    <span className="text-base inline-block text-black dark:text-neutral-100">
                      {app.location}
                    </span>
                  </div>
                  <h1 className="font-light -mt-1.5 text-nowrap overflow-scroll">
                    {app.name} - {app.power} Watt
                  </h1>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 shrink-0 rounded-full"
                    onClick={() => updateTargetUsage(app.name, -1)}
                    disabled={
                      targetUsage.find((item) => item.name === app.name)
                        ?.target === 0
                    }
                  >
                    <Minus />
                    <span className="sr-only">Decrease</span>
                  </Button>
                  <div className="flex-1 text-center">
                    <input
                      name={`target-${app.name}`}
                      type="number"
                      value={
                        targetUsage.find((item) => item.name === app.name)
                          ?.target || 0
                      }
                      onChange={(e) => {
                        const newTarget = Math.max(
                          0,
                          parseInt(e.target.value) || 0
                        ); // Minimal 0
                        setTargetUsage((prev) =>
                          prev.map((item) =>
                            item.name === app.name
                              ? { ...item, target: newTarget }
                              : item
                          )
                        );
                      }}
                      className="w-full text-2xl font-bold tracking-tighter bg-transparent border-none focus:outline-none text-center"
                    />
                    <div className="text-[0.60rem] font-medium uppercase text-muted-foreground -mt-5">
                      Hours/Day
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 shrink-0 rounded-full"
                    onClick={() => updateTargetUsage(app.name, 1)}
                  >
                    <Plus />
                    <span className="sr-only">Increase</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {success && (
            <div
              id="toast-danger"
              className="flex items-center w-fit p-4 mb-4 text-black bg-gradient-to-br from-lightGray via-lightGray to-teal-300 rounded-lg shadow fixed bottom-5 right-5 z-10"
              role="alert"
            >
              <div className="text-xl text-emerald-500">
                <IoCheckmarkDoneCircle />
              </div>
              <div className="ms-1 text-sm font-normal">
                Great! Your data has been saved successfully and is now ready to
                generate.
              </div>
            </div>
          )}
        </div>
        <div className="w-full flex justify-center items-center py-8">
          <button
            onClick={setDailyTarget}
            className="mr-6 py-2.5 px-6 rounded-full bg-gradient-to-br hover:bg-gradient-to-br from-teal-300 hover:from-yellow-300 via-lightGray to-tealBright hover:to-orange-400 shadow-strong shadow-white uppercase text-lg tracking-[.2rem] font-bold font-inter hover:shadow-orange-400 duration-500 cursor-pointer"
          >
            Save
          </button>
          <button
            onClick={generateRecommendation}
            className="py-2.5 px-6 rounded-full bg-gradient-to-br hover:bg-gradient-to-br from-teal-300 hover:from-yellow-300 via-lightGray to-tealBright hover:to-orange-400 shadow-strong shadow-white uppercase text-lg tracking-[.2rem] font-bold font-inter hover:shadow-orange-400 duration-500 cursor-pointer"
          >
            Generate Now
          </button>
        </div>
      </div>
    )
  ) : (
    <NotPremium />
  );
}

function AnalyzeResult({ data }: { data: ResponseType }) {
  const cards = data["analysis-result"];

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
      <div className="w-full flex justify-between items-start">
        <div>
          <h1 className="text-xl shadow-strong shadow-lightGray font-inter ml-4 mb-3 text-black bg-gradient-to-br from-lightGray via-lightGray to-teal-300 py-2 px-5 rounded-xl w-fit">
            Daily Appliance Usage Analysis
          </h1>
          <div className="ml-4 w-24 h-0.5 bg-lightGray mb-4"></div>
        </div>
        <div className="flex">
          <div className="h-10 w-36 bg-gradient-to-br rounded-lg flex items-center from-lightGray via-lightGray to-teal-300 mr-4 justify-center">
            <h1 className="text-black font-light flex items-center">
              Overused:{" "}
              <span className="font-bold text-red-600 mr-1">
                {cards.filter((card) => card.IsOveruse).length}
              </span>{" "}
              <FcElectroDevices />
            </h1>
          </div>
          <div className="h-10 w-32 bg-gradient-to-br rounded-lg flex items-center from-lightGray via-lightGray to-teal-300 mr-4 justify-center">
            <h1 className="text-black  font-light flex items-center">
              Efficient:{" "}
              <span className="font-bold text-emerald-600 mr-1">
                {cards.filter((card) => !card.IsOveruse).length}
              </span>{" "}
              <FcElectroDevices />
            </h1>
          </div>
          <div className="h-10 w-32 bg-gradient-to-br rounded-lg flex items-center from-lightGray via-lightGray to-teal-300 mr-4 justify-center">
            <h1 className="text-black font-light flex items-center">
              Total: <span className="font-bold mr-1">{cards.length}</span>{" "}
              <FcElectroDevices />
            </h1>
          </div>
        </div>
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
              key={`button-${active.ApplianceName}-${id}`}
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
              layoutId={`card-${active.ApplianceName}-${id}`}
              ref={ref}
              className={`relative w-full max-w-[500px] border-4 h-[38rem] flex flex-col bg-gradient-to-br sm:rounded-3xl from-gradientStart via-black via-30% to-gradientEnd border-orange-400`}
            >
              <motion.div layoutId={`image-${active.ApplianceName}-${id}`}>
                <img
                  width={200}
                  height={200}
                  src={`/appliance/${active.Type}.png`}
                  alt={active.ApplianceName || ""}
                  className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-contain object-top"
                />
              </motion.div>

              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <motion.h3
                    layoutId={`name-${active.ApplianceName}-${id}`}
                    className="font-bold text-lightGray"
                  >
                    {active.ApplianceName}
                  </motion.h3>
                  <motion.p
                    className={`py-1 px-3 rounded-full ${
                      active.IsOveruse ? "text-red-600" : "text-emerald-600"
                    } uppercase font-bold text-xs`}
                  >
                    {active.IsOveruse ? "Overuse" : "Normal"}
                  </motion.p>
                </div>
                <div className="flex gap-5 w-full justify-center items-center">
                  <div>
                    <div
                      className={`${
                        active.IsOveruse
                          ? "bg-red-600 shadow-red-600"
                          : "bg-emerald-600 shadow-emerald-600"
                      } h-32 w-32 rounded-full flex items-center justify-center my-3 shadow-strong`}
                    >
                      <div
                        className={`${
                          active.IsOveruse
                            ? "shadow-red-600"
                            : "shadow-emerald-600"
                        } h-28 w-28 bg-gradient-to-br from-gradientStart via-black to-gradientEnd rounded-full flex justify-center items-center shadow-inner-strong`}
                      >
                        <div
                          className={`${
                            active.IsOveruse
                              ? "text-red-600"
                              : "text-emerald-600"
                          } font-bold text-3xl relative`}
                        >
                          {active.Usage && <h1>{Math.floor(active.Usage)}</h1>}
                          <span className="text-xl absolute -bottom-5 left-1/2 -translate-x-1/2 cursor-pointer">
                            H
                          </span>
                        </div>
                      </div>
                    </div>
                    <h1
                      className={`${
                        active.IsOveruse ? "text-red-600" : "text-emerald-600"
                      } text-center font-semibold uppercase`}
                    >
                      Usage
                    </h1>
                  </div>
                  <div className="text-white text-4xl -mt-5">
                    {active.IsOveruse ? <FaChevronRight /> : <FaChevronLeft />}
                  </div>
                  <div>
                    <div
                      className={`bg-lightGray shadow-lightGray h-32 w-32 rounded-full flex items-center justify-center my-3 shadow-strong`}
                    >
                      <div
                        className={`shadow-lightGray h-28 w-28 bg-gradient-to-br from-gradientStart via-black to-gradientEnd rounded-full flex justify-center items-center shadow-inner-strong`}
                      >
                        <div
                          className={`text-lightGray font-bold text-3xl relative`}
                        >
                          {active.Usage && <h1>{active.Target}</h1>}
                          <span className="text-xl absolute -bottom-5 left-1/2 -translate-x-1/2 cursor-pointer">
                            H
                          </span>
                        </div>
                      </div>
                    </div>
                    <h1
                      className={`text-lightGray text-center font-semibold uppercase`}
                    >
                      Target
                    </h1>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul className="px-4 w-full gap-4 overflow-scroll h-[90%]">
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card.ApplianceName}-${id}`}
            key={`card-${card.ApplianceName}-${id}`}
            onClick={() => setActive(card)}
            className="p-4 flex flex-col md:flex-row justify-between border-b border-neutral-50 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:rounded-xl cursor-pointer"
          >
            <div className="flex gap-4 flex-col md:flex-row ">
              <motion.div layoutId={`image-${card.ApplianceName}-${id}`}>
                <img
                  width={100}
                  height={100}
                  src={`/appliance/${card.Type}.png`}
                  alt={card.ApplianceName || ""}
                  className="h-40 w-40 md:h-14 md:w-14 rounded-lg object-cover object-top"
                />
              </motion.div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-4">
                  <motion.h3
                    layoutId={`name-${card.ApplianceName}-${id}`}
                    className="font-medium text-neutral-800 dark:text-neutral-200 text-center md:text-left"
                  >
                    {card.ApplianceName}
                  </motion.h3>
                  <motion.p
                    className={`rounded-full uppercase font-bold text-xs w-fit ${
                      card.IsOveruse
                        ? "bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-800"
                        : "bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-800"
                    }`}
                  >
                    {card.IsOveruse ? "Overuse" : "Normal"}
                  </motion.p>
                </div>
                <div
                  className={`${
                    card.IsOveruse ? "text-red-600" : "text-emerald-600"
                  } bg-gradient-to-br from-lightGray via-lightGray to-teal-300 font-inter rounded-lg py-2 px-4 flex items-center gap-2`}
                >
                  <div>
                    {card.IsOveruse ? (
                      <IoIosWarning />
                    ) : (
                      <IoCheckmarkDoneCircle />
                    )}
                  </div>
                  <p className="text-sm">
                    {card.IsOveruse ? (
                      <>
                        <span className="font-semibold">
                          {card.Message.split(" ")[0]}
                        </span>
                        <span>
                          {" " + card.Message.split(" ").slice(1).join(" ")}
                        </span>
                      </>
                    ) : (
                      card.Message
                    )}
                  </p>
                </div>
              </div>
            </div>
            <motion.button
              type="button"
              layoutId={`button-${card.ApplianceName}-${id}`}
              className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-gradient-to-r hover:from-teal-200 hover:to-tealBright hover:text-white text-black mt-4 md:mt-0"
            >
              Detail
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
