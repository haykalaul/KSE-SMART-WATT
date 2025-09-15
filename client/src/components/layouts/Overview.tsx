import { AllAppliances, Appliance, OverusedDevices } from "@/types/type";
import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  convertToHoursMinutes,
  findOverusedDevices,
  processAppliances,
} from "@/helper/function";
import { ChartComponent } from "../templates/Chart";
import { OverusedDeviceComponent } from "../templates/OverusedDevice";
import { NumberTicker } from "../ui/number-ticker";
import { getBackendURL, getMode } from "@/lib/readenv";
// import * as moment from "moment-duration-format";

export default function Overview() {
  const backendURL =
    getMode() === "production" ? getBackendURL() : "http://localhost:8080";

  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  // GET request to fetch table data🐳
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
    }
  }, [data]);
  // GET request to fetch table data🐳

  // GET request to fetch all appliances data🐳
  const [allAppliances, setAllAppliances] = useState<AllAppliances>({
    "Connectivity Status": [],
    "Cost (IDR)": [],
    "Device ID": [],
    "Device Name": [],
    "Device Type": [],
    "Duration (Hours)": [],
    "Energy Consumption (kWh)": [],
    Location: [],
    "Power Rating (Watt)": [],
    "Status (ON/OFF)": [],
    "Usage End Time": [],
    "Usage Start Time": [],
  });

  const [analysisResult, setAnalysisResult] = useState({
    totalEnergyConsumption: 0,
    averageEnergyConsumption: 0,
    connectedDevicesCount: 0,
    maxEnergyDevice: {
      "Device Name": "",
      "Device Type": "",
      "Energy Consumption (kWh)": 0,
    },
    maxDurationDevice: {
      "Device Name": "",
      "Device Type": "",
      "Duration (Hours)": 0,
    },
  });
  const allAppliancesFetcher = (url: string, init: RequestInit | undefined) =>
    fetch(url, init).then((res) => res.json());
  const { data: alldata } = useSWR(`${backendURL}/v1/all-appliances`, (url) =>
    allAppliancesFetcher(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
  );

  useEffect(() => {
    if (alldata?.status) {
      setAllAppliances(alldata.data);

      const {
        totalEnergyConsumption,
        averageEnergyConsumption,
        connectedDevicesCount,
        maxEnergyDevice,
        maxDurationDevice,
      } = processAppliances(alldata.data);

      setAnalysisResult({
        totalEnergyConsumption,
        averageEnergyConsumption,
        connectedDevicesCount,
        maxEnergyDevice,
        maxDurationDevice,
      });
    }
  }, [alldata]);
  // GET request to fetch all appliances data🐳

  const [overusedDevices, setOverusedDevices] = useState<{
    devices: OverusedDevices[];
    percentage: number;
  }>({ devices: [], percentage: 0 });

  useEffect(() => {
    const result = findOverusedDevices(allAppliances, appliance);
    const percentage = Math.round(
      (result.length / allAppliances["Device ID"].length) * 100
    );
    setOverusedDevices({ devices: result, percentage });
  }, [appliance, allAppliances]);

  return (
    <div className="w-full overflow-hidden relative h-full">
      <div className="h-full grid grid-cols-5 gap-4 p-4 grid-rows-2">
        <Carousel
          orientation="horizontal"
          className="col-span-2 h-full rounded-3xl bg-gradient-to-br from-gradientStart to-gradientEnd py-2 px-4"
        >
          <CarouselContent className="rounded-3xl">
            {appliance.map((app, index) => (
              <CarouselItem className="flex items-center gap-5" key={index}>
                <img
                  className="w-1/3 h-full object-contain"
                  src={`/appliance/${app.type}.png`}
                  alt=""
                />
                <div className="flex flex-col justify-center w-full">
                  <div className="mt-2 mb-4 flex justify-between items-center">
                    <div className="basis-2/3">
                      <h2 className="text-zinc-300 text-[0.7rem] font-light -mb-1">
                        Device
                      </h2>
                      <h1 className="text-white text-xl font-semibold line-clamp-1">
                        {app.name}
                      </h1>
                    </div>
                    <h1 className="basis-1/3 text-tealBright font-bold text-2xl">
                      {app.power}{" "}
                      <span className="text-xs font-light -ml-1">Watt</span>
                    </h1>
                  </div>
                  <div className="rounded-xl px-3 py-3 flex justify-between w-full bg-teal-300">
                    <div className="basis-1/2 flex flex-col items-center border-r border-black">
                      <h1 className="text-center">
                        {convertToHoursMinutes(app.usage_today)}
                      </h1>
                      <p className="text-center text-[0.6rem]">Time Usage</p>
                    </div>
                    <div className="basis-1/2 flex flex-col items-center">
                      <h2 className="text-center">{app.energy} kWh</h2>
                      <p className="text-center text-[0.6rem]">
                        Energy Consumption
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl mt-3 px-3 py-3 flex justify-between w-full bg-teal-300">
                    <h1 className="font-light text-zinc-800">Cost: </h1>
                    <h2 className="font-bold text-lg">IDR {app.cost}</h2>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <div className="bg-gradient-to-br from-gradientStart to-gradientEnd w-full h-full rounded-3xl flex flex-col items-center justify-center py-1">
          <h1 className="font-semibold text-white">Device Usage Insights</h1>
          <div
            className={`${
              overusedDevices.percentage > 50
                ? "bg-red-600 shadow-red-600"
                : "bg-green-600 shadow-green-600"
            } h-32 w-32 rounded-full flex items-center justify-center my-3 shadow-strong`}
          >
            <div
              className={`${
                overusedDevices.percentage > 50
                  ? "shadow-red-600"
                  : "shadow-green-600"
              } h-28 w-28 bg-gradient-to-br from-gradientStart to-gradientEnd rounded-full flex justify-center items-center shadow-inner-strong`}
            >
              <div
                className={`${
                  overusedDevices.percentage > 50
                    ? "text-red-600"
                    : "text-green-600"
                } font-bold text-3xl relative`}
              >
                {overusedDevices.percentage && (
                  <NumberTicker
                    className={`${
                      overusedDevices.percentage > 50
                        ? "text-red-600"
                        : "text-green-600"
                    } font-bold text-3xl relative`}
                    value={overusedDevices.percentage}
                  />
                )}
                %
                <span className="text-xl absolute -bottom-5 left-1/2 -translate-x-1/2 cursor-pointer">
                  <OverusedDeviceComponent
                    data={overusedDevices.devices}
                    appliancesLength={allAppliances["Device ID"].length}
                  />
                </span>
              </div>
            </div>
          </div>
          {overusedDevices.percentage > 50 ? (
            <h2 className="text-red-600 text-[0.6rem] w-3/4 font-semibold text-center">
              Warning: {overusedDevices.percentage}% of your devices are being
              used more than usual.
            </h2>
          ) : (
            <h2 className="text-green-600 text-[0.6rem] w-3/4 font-semibold text-center">
              Awesome! Only 30% {overusedDevices.percentage}% of your devices
              exceeded their average usage.
            </h2>
          )}
        </div>
        <div className="col-span-2 row-span-2 w-full h-full rounded-3xl flex flex-col gap-4">
          <div className="rounded-3xl bg-gradient-to-br from-gradientStart to-gradientEnd w-full h-full overflow-hidden">
            <ChartComponent
              appliance={appliance}
              totalEnergy={analysisResult.totalEnergyConsumption}
              date={allAppliances["Usage Start Time"][0]}
            />
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-gradientStart to-gradientEnd w-full h-20 flex overflow-scroll items-center px-3 gap-3">
            {allAppliances.Location.filter((item, index) => {
              return allAppliances.Location.indexOf(item) === index;
            }).map((location, index) => (
              <h1
                key={index}
                className="font-semibold py-2 px-5 text-center text-nowrap rounded-2xl bg-gradient-to-b from-lightGray to-teal-300"
              >
                {location}
              </h1>
            ))}
          </div>
        </div>
        <div className="col-span-3 row-start-2 h-full w-full rounded-3xl bg-gradient-to-br from-gradientStart to-gradientEnd flex flex-col items-center py-3 px-6">
          <div className="flex justify-between items-center gap-4 w-full h-full">
            <div className="flex flex-col  w-full">
              <h1 className="text-center font-light text-xl text-white mb-3">
                {analysisResult.maxEnergyDevice["Device Name"]}
              </h1>
              <div className="flex justify-center items-center">
                <img
                  className="h-24 object-contain mb-4 bg-gradient-to-b from-teal-300 to-teal-100 aspect-square rounded-full -mr-2"
                  src={`/appliance/${analysisResult.maxEnergyDevice["Device Type"]}.png`}
                  alt=""
                />
                <h1 className="text-tealBright font-bold text-3xl p-5 border-4 border-tealBright rounded-full aspect-square bg-lightGray flex items-center justify-end flex-col">
                  {analysisResult.maxEnergyDevice["Energy Consumption (kWh)"]}{" "}
                  <span className="block font-light text-lg -mt-2.5">kWh</span>
                </h1>
              </div>
              <h1 className="text-zinc-200 font-semibold text-center">
                Highest Energy Consumption
              </h1>
              <h2 className="text-tealBright font-bold text-2xl text-center -mt-1">
                in a Single Use
              </h2>
            </div>
            <div className="flex flex-col  w-full">
              <h1 className="text-center font-light text-xl text-white mb-3">
                {analysisResult.maxDurationDevice["Device Name"]}
              </h1>
              <div className="flex justify-center items-center">
                <img
                  className="h-24 object-contain mb-4 bg-gradient-to-b from-teal-300 to-teal-100 aspect-square rounded-full -mr-2"
                  src={`/appliance/${analysisResult.maxDurationDevice["Device Type"]}.png`}
                  alt=""
                />
                <h1 className="text-tealBright font-bold text-3xl p-5 border-4 border-tealBright rounded-full aspect-square bg-lightGray flex items-center justify-end flex-col">
                  {analysisResult.maxDurationDevice["Duration (Hours)"]}{" "}
                  <span className="block font-light text-lg -mt-2.5">
                    Hours
                  </span>
                </h1>
              </div>
              <h1 className="text-zinc-200 font-semibold text-center">
                Longest Usage Duration
              </h1>
              <h2 className="text-tealBright font-bold text-2xl text-center -mt-1">
                in a Single Session
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
